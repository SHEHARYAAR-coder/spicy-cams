import { useState, useEffect, useCallback, useRef } from "react";
import {
  getCachedPrivateMessages,
  setCachedPrivateMessages,
  getCachedConversations,
  setCachedConversations,
  addPrivateMessageToCache,
} from "@/lib/private-chat-cache";

export interface PrivateMessage {
  id: string;
  message: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  isPending?: boolean; // For optimistic updates
  sender: {
    id: string;
    name: string;
    image?: string;
    role: string;
  };
}

export interface PrivateConversation {
  partnerId: string;
  partnerName: string;
  partnerImage?: string;
  partnerRole: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  senderRole: string;
  initialMessage?: string;
  createdAt: string;
  expiresAt?: string;
}

export type ChatRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | null;


interface UsePrivateChatProps {
  streamId: string;
  receiverId?: string;
  token: string | null;
  enabled?: boolean;
  isModel?: boolean; // Whether the user is the stream model (can receive chat requests)
  skipPolling?: boolean; // If true, fetch once but don't poll (for badge counts)
}

export function usePrivateChat({
  streamId,
  receiverId,
  token,
  enabled = true,
  isModel = false,
  skipPolling = false,
}: UsePrivateChatProps) {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [requestStatus, setRequestStatus] = useState<ChatRequestStatus>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);


  // Polling refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageSeenRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Store refs to latest function versions to avoid dependency loops
  const fetchConversationsRef = useRef<((showLoading?: boolean) => Promise<void>) | null>(null);
  const fetchChatRequestsRef = useRef<(() => Promise<void>) | null>(null);
  const fetchMessagesRef = useRef<((receiverId: string) => Promise<void>) | null>(null);
  const receiverIdRef = useRef<string | undefined>(receiverId);

  // Fetch conversations list
  const fetchConversations = useCallback(async (showLoading = false) => {
    if (!token || !enabled) {
      // Reset loading if we're skipping the fetch
      if (showLoading) setLoading(false);
      return;
    }

    // Load from cache first for instant display
    const cached = getCachedConversations(streamId);
    if (cached && cached.length > 0) {
      setConversations(cached);
    }

    // Show loading only on initial load if no cache
    if (showLoading && (!cached || cached.length === 0)) {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `/api/streams/${streamId}/private-conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        // Cache the conversations
        setCachedConversations(streamId, data.conversations || []);
      } else {
        console.error("Failed to fetch conversations");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [streamId, token, enabled]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(
    async (partnerId: string) => {
      if (!token || !enabled) return;

      // Load from cache first for instant display (no loading state)
      const cached = getCachedPrivateMessages(streamId, partnerId);
      if (cached && cached.length > 0) {
        setMessages(cached);
        cached.forEach((msg) => messageSeenRef.current.add(msg.id));
        isInitialLoadRef.current = false;
      }

      // Only show loading state if it's the initial load and no cache
      if (isInitialLoadRef.current && (!cached || cached.length === 0)) {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await fetch(
          `/api/streams/${streamId}/private-messages/${partnerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const newMessages = data.messages || [];

          // Check if there's a request status in the response
          if (data.requestStatus) {
            setRequestStatus(data.requestStatus);
          }

          // Add to seen set
          newMessages.forEach((msg: PrivateMessage) =>
            messageSeenRef.current.add(msg.id)
          );

          setMessages(newMessages);

          // Cache the messages
          setCachedPrivateMessages(streamId, partnerId, newMessages);

          // Refresh conversations to update unread counts (silently)
          fetchConversations();

          isInitialLoadRef.current = false;
        } else {
          const data = await response.json();
          setError(data.error || "Failed to fetch messages");
          // If no chat request exists yet, reflect this in state for UI gating
          if ((response as Response).status === 403) {
            if (
              typeof data.error === "string" &&
              (data.error.toLowerCase().includes("no chat request") ||
                data.error.toLowerCase().includes("please send a chat request"))
            ) {
              // Normalize to no active request so UI can gate input
              setRequestStatus(null);
              setMessages([]);
            }
          }
        }
      } catch (error) {
        setError("Failed to fetch messages");
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    },
    [streamId, token, enabled, fetchConversations]
  );

  // Send a private message with optimistic updates
  const sendMessage = useCallback(
    async (message: string, targetReceiverId: string) => {
      if (!token || !message.trim()) return false;

      // Create optimistic message
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage: PrivateMessage = {
        id: tempId,
        message: message.trim(),
        senderId: "current-user",
        receiverId: targetReceiverId,
        createdAt: new Date().toISOString(),
        isRead: false,
        isPending: true,
        sender: {
          id: "current-user",
          name: "You",
          role: "VIEWER",
        },
      };

      // Add optimistic message immediately
      if (targetReceiverId === receiverId) {
        setMessages((prev) => [...prev, optimisticMessage]);
      }

      setSending(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/streams/${streamId}/private-messages/${targetReceiverId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message: message.trim() }),
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Replace optimistic message with real one
          if (targetReceiverId === receiverId) {
            setMessages((prev) => {
              const filtered = prev.filter((msg) => msg.id !== tempId);
              const updated = [...filtered, data.message];

              // Cache updated messages
              setCachedPrivateMessages(streamId, targetReceiverId, updated);

              return updated;
            });
          } else {
            // If not current conversation, just cache it
            addPrivateMessageToCache(streamId, targetReceiverId, data.message);
          }

          // Add to seen set
          messageSeenRef.current.add(data.message.id);

          // Refresh conversations list (silently)
          fetchConversations();
          return true;
        } else {
          const data = await response.json();
          setError(data.error || "Failed to send message");

          // Remove optimistic message on failure
          if (targetReceiverId === receiverId) {
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          }

          return false;
        }
      } catch (error) {
        setError("Failed to send message");
        console.error("Error sending message:", error);

        // Remove optimistic message on error
        if (targetReceiverId === receiverId) {
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        }

        return false;
      } finally {
        setSending(false);
      }
    },
    [streamId, token, receiverId, fetchConversations]
  );

  // Fetch pending chat requests (for models only)
  const fetchChatRequests = useCallback(async () => {
    // Only fetch chat requests if user is the model
    if (!token || !enabled || !isModel) return;

    try {
      const response = await fetch(
        `/api/streams/${streamId}/chat-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChatRequests(data.requests || []);
      } else if (response.status === 403) {
        // 403 means user is not the model - this is expected for viewers
        // Silently ignore and don't log error
        setChatRequests([]);
      } else {
        console.error("Failed to fetch chat requests:", response.status);
      }
    } catch (error) {
      console.error("Error fetching chat requests:", error);
    }
  }, [streamId, token, enabled, isModel]);

  // Update refs with latest function versions to avoid dependency loops
  useEffect(() => {
    fetchConversationsRef.current = fetchConversations;
  }, [fetchConversations]);

  useEffect(() => {
    fetchChatRequestsRef.current = fetchChatRequests;
  }, [fetchChatRequests]);

  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);

  useEffect(() => {
    receiverIdRef.current = receiverId;
  }, [receiverId]);

  // Send a chat request
  const sendChatRequest = useCallback(
    async (targetReceiverId: string, initialMessage?: string) => {
      if (!token) return false;

      setSending(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/streams/${streamId}/chat-requests`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              receiverId: targetReceiverId,
              initialMessage,
            }),
          }
        );

        if (response.ok) {
          await response.json();
          setRequestStatus("PENDING");
          return true;
        } else {
          const data = await response.json();
          setError(data.error || "Failed to send chat request");
          return false;
        }
      } catch (error) {
        setError("Failed to send chat request");
        console.error("Error sending chat request:", error);
        return false;
      } finally {
        setSending(false);
      }
    },
    [streamId, token]
  );

  // Accept a chat request
  const acceptChatRequest = useCallback(
    async (requestId: string) => {
      if (!token) return false;

      try {
        const response = await fetch(
          `/api/streams/${streamId}/chat-requests/${requestId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: "accept" }),
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Remove the accepted request from the list immediately
          setChatRequests(prev => prev.filter(req => req.id !== requestId));

          // Update request status if this is the current conversation
          if (data.request?.senderId === receiverId) {
            setRequestStatus("ACCEPTED");
          }

          // Force refresh conversations to get the new conversation
          await fetchConversations(false);
          await fetchChatRequests();

          return true;
        } else {
          const data = await response.json();
          setError(data.error || "Failed to accept chat request");
          return false;
        }
      } catch (error) {
        setError("Failed to accept chat request");
        console.error("Error accepting chat request:", error);
        return false;
      }
    },
    [streamId, token, receiverId, fetchChatRequests, fetchConversations]
  );

  // Reject a chat request
  const rejectChatRequest = useCallback(
    async (requestId: string) => {
      if (!token) return false;

      try {
        const response = await fetch(
          `/api/streams/${streamId}/chat-requests/${requestId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: "reject" }),
          }
        );

        if (response.ok) {
          // Refresh chat requests
          fetchChatRequests();
          return true;
        } else {
          const data = await response.json();
          setError(data.error || "Failed to reject chat request");
          return false;
        }
      } catch (error) {
        setError("Failed to reject chat request");
        console.error("Error rejecting chat request:", error);
        return false;
      }
    },
    [streamId, token, fetchChatRequests]
  );


  // Start polling for new messages and conversations
  // NO DEPENDENCIES - uses refs to get latest function values
  const startPolling = useCallback(() => {
    // Skip polling if disabled or skipPolling flag is set
    if (!enabled || !token || skipPolling) return;

    // Clear any existing abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Poll conversations every 30 seconds (reduced from 10 seconds to minimize API calls)
    pollIntervalRef.current = setInterval(() => {
      if (abortControllerRef.current?.signal.aborted) return;
      
      // Use refs to get latest function versions (with null checks)
      if (fetchConversationsRef.current) {
        fetchConversationsRef.current();
      }
      if (fetchChatRequestsRef.current) {
        fetchChatRequestsRef.current();
      }

      // If we have an active conversation, refresh its messages too
      if (receiverIdRef.current && fetchMessagesRef.current) {
        fetchMessagesRef.current(receiverIdRef.current);
      }
    }, 30000);
  }, [enabled, token, skipPolling]); // ONLY external control flags - not functions!

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    // Abort any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Effect to manage polling
  // ONLY depends on external control flags, not functions
  useEffect(() => {
    if (enabled && token) {
      // Only show loading on very first initialization
      const shouldShowLoading = isInitialLoadRef.current && conversations.length === 0;
      startPolling();
      // Add null checks for refs that may not be set yet
      if (fetchConversationsRef.current) {
        fetchConversationsRef.current(shouldShowLoading);
      }
      if (fetchChatRequestsRef.current) {
        fetchChatRequestsRef.current();
      }
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [enabled, token, startPolling, stopPolling, conversations.length]);

  // Effect to fetch messages when receiverId changes
  useEffect(() => {
    if (receiverId && enabled && token) {
      // Reset initial load flag for new conversation
      isInitialLoadRef.current = true;
      messageSeenRef.current.clear();
      setRequestStatus(null); // Reset request status
      fetchMessages(receiverId);
    } else {
      setMessages([]);
      setRequestStatus(null);
      isInitialLoadRef.current = true;
    }
  }, [receiverId, enabled, token, fetchMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    messages,
    conversations,
    chatRequests,
    requestStatus,
    loading,
    error,
    sending,
    sendMessage,
    sendChatRequest,
    acceptChatRequest,
    rejectChatRequest,
    fetchMessages,
    fetchConversations,
    fetchChatRequests,
  };
}
