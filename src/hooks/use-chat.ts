import { useState, useEffect, useCallback, useRef } from "react";
import { getCachedMessages, setCachedMessages, addMessageToCache, removeMessageFromCache } from "@/lib/chat-cache";

export interface ChatMessage {
  id: string;
  message: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
  };
  createdAt: string;
  isPending?: boolean; // For optimistic updates
}

export interface ChatEvent {
  type: "message" | "delete" | "mute" | "ban" | "connection" | "moderation";
  data?: any;
  status?: string;
  role?: string;
  timestamp: string;
}

export interface UseChatOptions {
  streamId: string;
  token: string | null;
  enabled?: boolean;
  autoReconnect?: boolean;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  connected: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<boolean>;
  loadMoreMessages: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
  remaining: number | null;
  connectionQuality: "good" | "poor" | "disconnected";
}

export function useChat({
  streamId,
  token,
  enabled = true,
  autoReconnect = true,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<"good" | "poor" | "disconnected">("disconnected");

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const messageSeenRef = useRef<Set<string>>(new Set()); // Deduplication
  const lastHeartbeatRef = useRef<number>(Date.now());
  const pendingMessagesRef = useRef<Map<string, ChatMessage>>(new Map());
  const sendQueueRef = useRef<Array<{message: string, resolve: (value: boolean) => void, reject: (reason?: any) => void}>>([]);
  const isSendingRef = useRef(false);

  // Monitor connection quality
  useEffect(() => {
    if (!connected) {
      setConnectionQuality("disconnected");
      return;
    }

    const checkQuality = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
      if (timeSinceLastHeartbeat > 60000) {
        setConnectionQuality("poor");
      } else {
        setConnectionQuality("good");
      }
    }, 5000);

    return () => clearInterval(checkQuality);
  }, [connected]);

  // Process send queue
  const processSendQueue = useCallback(async () => {
    if (isSendingRef.current || sendQueueRef.current.length === 0) return;
    
    isSendingRef.current = true;
    const item = sendQueueRef.current.shift();
    
    if (!item) {
      isSendingRef.current = false;
      return;
    }

    try {
      if (!token || !connected) {
        item.reject(new Error("Not connected to chat"));
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message: item.message }),
      });

      if (!response.ok) {
        const data = await response.json();
        
        if (response.status === 429) {
          setError(`Rate limit exceeded. Try again in ${data.resetIn} seconds.`);
        } else {
          setError(data.error || "Failed to send message");
        }
        
        item.resolve(false);
        return;
      }

      const data = await response.json();
      setRemaining(data.remaining);
      setError(null);
      item.resolve(true);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
      item.resolve(false);
    } finally {
      isSendingRef.current = false;
      // Process next message in queue
      if (sendQueueRef.current.length > 0) {
        setTimeout(processSendQueue, 100); // Small delay between messages
      }
    }
  }, [token, connected]);

  // Load initial messages
  const loadMessages = useCallback(
    async (beforeId?: string) => {
      if (!streamId) return;

      // Load from cache first for instant display
      if (!beforeId) {
        const cached = getCachedMessages(streamId);
        if (cached && cached.length > 0) {
          setMessages(cached);
          cached.forEach((msg) => messageSeenRef.current.add(msg.id));
        }
      }

      setLoading(true);
      try {
        const url = new URL(
          `/api/streams/${streamId}/messages`,
          window.location.origin
        );
        if (beforeId) {
          url.searchParams.set("before", beforeId);
        }
        url.searchParams.set("limit", "100");

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error("Failed to load messages");
        }

        const data = await response.json();

        if (beforeId) {
          setMessages((prev) => {
            const newMessages = data.messages.filter(
              (msg: ChatMessage) => !messageSeenRef.current.has(msg.id)
            );
            newMessages.forEach((msg: ChatMessage) => messageSeenRef.current.add(msg.id));
            return [...newMessages, ...prev];
          });
        } else {
          setMessages(data.messages);
          data.messages.forEach((msg: ChatMessage) => messageSeenRef.current.add(msg.id));
          // Cache the messages for future quick loads
          setCachedMessages(streamId, data.messages);
        }

        setHasMore(data.hasMore);
      } catch (err) {
        console.error("Error loading messages:", err);
        setError("Failed to load messages");
      } finally {
        setLoading(false);
      }
    },
    [streamId]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loading || messages.length === 0) return;

    const oldestMessage = messages[0];
    await loadMessages(oldestMessage.id);
  }, [hasMore, loading, messages, loadMessages]);

  // Connect to SSE
  const connect = useCallback(() => {
    if (!token || !enabled || !streamId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const url = new URL("/api/chat", window.location.origin);
      url.searchParams.set("token", token);

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("Chat connected");
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        lastHeartbeatRef.current = Date.now();
      };

      eventSource.onmessage = (event) => {
        lastHeartbeatRef.current = Date.now(); // Update heartbeat timestamp
        
        // Handle heartbeat
        if (event.data.startsWith(":")) {
          return;
        }

        try {
          const chatEvent: ChatEvent = JSON.parse(event.data);

          switch (chatEvent.type) {
            case "connection":
              console.log("Chat connection established");
              break;

            case "message":
              if (chatEvent.data) {
                const newMessage = chatEvent.data as ChatMessage;
                
                // Deduplicate messages
                if (messageSeenRef.current.has(newMessage.id)) {
                  return;
                }
                
                messageSeenRef.current.add(newMessage.id);
                
                // Remove pending message if it exists
                if (pendingMessagesRef.current.has(newMessage.id)) {
                  pendingMessagesRef.current.delete(newMessage.id);
                }
                
                setMessages((prev) => {
                  // Remove any pending version
                  const filtered = prev.filter(msg => msg.id !== newMessage.id);
                  const updated = [...filtered, newMessage];
                  
                  // Cache the updated messages
                  setCachedMessages(streamId, updated);
                  
                  return updated;
                });
              }
              break;

            case "moderation":
              if (
                chatEvent.data?.type === "delete" &&
                chatEvent.data?.messageId
              ) {
                setMessages((prev) => {
                  const filtered = prev.filter((msg) => msg.id !== chatEvent.data.messageId);
                  
                  // Update cache
                  removeMessageFromCache(streamId, chatEvent.data.messageId);
                  
                  return filtered;
                });
                messageSeenRef.current.delete(chatEvent.data.messageId);
              }
              break;
          }
        } catch (err) {
          console.error("Error parsing chat event:", err);
        }
      };

      eventSource.onerror = () => {
        console.error("Chat connection error");
        setConnected(false);
        eventSource.close();

        // Auto-reconnect with exponential backoff
        if (autoReconnect && reconnectAttemptsRef.current < 5) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `Reconnecting... (attempt ${reconnectAttemptsRef.current})`
            );
            connect();
          }, delay);
        } else {
          setError("Connection lost. Please refresh the page.");
        }
      };
    } catch (err) {
      console.error("Error connecting to chat:", err);
      setError("Failed to connect to chat");
      setConnected(false);
    }
  }, [token, enabled, streamId, autoReconnect]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setConnected(false);
  }, []);

  // Send message with optimistic updates
  const sendMessage = useCallback(
    async (message: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        // Generate temporary ID for optimistic update
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const optimisticMessage: ChatMessage = {
          id: tempId,
          message,
          userId: "current-user", // This should be replaced with actual user ID
          user: {
            id: "current-user",
            displayName: "You",
            avatarUrl: null,
            role: "VIEWER",
          },
          createdAt: new Date().toISOString(),
          isPending: true,
        };

        // Add optimistic message
        pendingMessagesRef.current.set(tempId, optimisticMessage);
        setMessages((prev) => [...prev, optimisticMessage]);

        // Add to send queue
        sendQueueRef.current.push({
          message,
          resolve: (success) => {
            if (!success) {
              // Remove optimistic message on failure
              setMessages((prev) => prev.filter(msg => msg.id !== tempId));
              pendingMessagesRef.current.delete(tempId);
            }
            resolve(success);
          },
          reject: (error) => {
            // Remove optimistic message on error
            setMessages((prev) => prev.filter(msg => msg.id !== tempId));
            pendingMessagesRef.current.delete(tempId);
            reject(error);
          }
        });

        // Start processing queue
        processSendQueue();
      });
    },
    [processSendQueue]
  );

  // Load initial messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Connect/disconnect based on enabled and token
  useEffect(() => {
    if (enabled && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, token, connect, disconnect]);

  return {
    messages,
    connected,
    error,
    sendMessage,
    loadMoreMessages,
    hasMore,
    loading,
    remaining,
    connectionQuality,
  };
}
