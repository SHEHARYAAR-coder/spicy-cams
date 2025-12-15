import { useState, useEffect, useCallback, useRef } from "react";

const INBOX_STREAM_ID = "inbox-global"; // Placeholder streamId for compatibility

export interface InboxMessage {
  id: string;
  message: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  isPending?: boolean;
  sender: {
    id: string;
    name: string;
    image?: string;
    role: string;
  };
}

export interface InboxConversation {
  partnerId: string;
  partnerName: string;
  partnerImage?: string;
  partnerRole: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface UseInboxProps {
  partnerId?: string;
  token: string | null;
  enabled?: boolean;
}

export function useInbox({
  partnerId,
  token,
  enabled = true,
}: UseInboxProps) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageSeenRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Fetch all conversations
  const fetchConversations = useCallback(async (showLoading = false) => {
    if (!token || !enabled) return;

    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/inbox/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
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
  }, [token, enabled]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(
    async (userId: string) => {
      if (!token || !enabled) return;

      if (isInitialLoadRef.current) {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await fetch(`/api/inbox/messages/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const newMessages = data.messages || [];

          newMessages.forEach((msg: InboxMessage) =>
            messageSeenRef.current.add(msg.id)
          );

          setMessages(newMessages);

          // Refresh conversations to update unread counts
          fetchConversations();

          isInitialLoadRef.current = false;
        } else {
          const data = await response.json();
          setError(data.error || "Failed to fetch messages");
        }
      } catch (error) {
        setError("Failed to fetch messages");
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    },
    [token, enabled, fetchConversations]
  );

  // Send a message
  const sendMessage = useCallback(
    async (message: string, targetUserId: string) => {
      if (!token || !message.trim()) return false;

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage: InboxMessage = {
        id: tempId,
        message: message.trim(),
        senderId: "current-user",
        receiverId: targetUserId,
        createdAt: new Date().toISOString(),
        isRead: false,
        isPending: true,
        sender: {
          id: "current-user",
          name: "You",
          role: "VIEWER",
        },
      };

      // Add optimistic message
      if (targetUserId === partnerId) {
        setMessages((prev) => [...prev, optimisticMessage]);
      }

      setSending(true);
      setError(null);

      try {
        const response = await fetch(`/api/inbox/messages/${targetUserId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: message.trim() }),
        });

        if (response.ok) {
          const data = await response.json();

          // Replace optimistic message with real one
          if (targetUserId === partnerId) {
            setMessages((prev) => {
              const filtered = prev.filter((msg) => msg.id !== tempId);
              return [...filtered, data.message];
            });
          }

          // Update conversations list
          fetchConversations();

          return true;
        } else {
          const data = await response.json();
          setError(data.error || "Failed to send message");

          // Remove optimistic message on failure
          if (targetUserId === partnerId) {
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          }

          return false;
        }
      } catch (error) {
        setError("Failed to send message");
        console.error("Error sending message:", error);

        // Remove optimistic message on failure
        if (targetUserId === partnerId) {
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        }

        return false;
      } finally {
        setSending(false);
      }
    },
    [token, partnerId, fetchConversations]
  );

  // Start polling
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;

    pollIntervalRef.current = setInterval(() => {
      fetchConversations();

      if (partnerId) {
        fetchMessages(partnerId);
      }
    }, 10000); // Poll every 10 seconds
  }, [fetchConversations, partnerId, fetchMessages]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Effect to manage polling
  useEffect(() => {
    if (enabled && token) {
      const shouldShowLoading = isInitialLoadRef.current && conversations.length === 0;
      startPolling();
      fetchConversations(shouldShowLoading);
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [enabled, token, startPolling, stopPolling, fetchConversations, conversations.length]);

  // Effect to fetch messages when partnerId changes
  useEffect(() => {
    if (partnerId && enabled && token) {
      isInitialLoadRef.current = true;
      messageSeenRef.current.clear();
      fetchMessages(partnerId);
    } else {
      setMessages([]);
      isInitialLoadRef.current = true;
    }
  }, [partnerId, enabled, token, fetchMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    messages,
    conversations,
    loading,
    error,
    sending,
    sendMessage,
    fetchMessages,
    fetchConversations,
    streamId: INBOX_STREAM_ID, // Expose for compatibility
  };
}
