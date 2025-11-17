/**
 * Private chat message caching utility
 * Uses localStorage for caching private messages to improve load times
 */

import { PrivateMessage, PrivateConversation } from "@/hooks/use-private-chat";

const CACHE_PREFIX_MESSAGES = "private_messages_";
const CACHE_PREFIX_CONVERSATIONS = "private_conversations_";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHED_MESSAGES = 100;

interface CachedMessages {
  messages: PrivateMessage[];
  timestamp: number;
  streamId: string;
  partnerId: string;
}

interface CachedConversations {
  conversations: PrivateConversation[];
  timestamp: number;
  streamId: string;
}

/**
 * Get cached messages for a conversation
 */
export function getCachedPrivateMessages(
  streamId: string,
  partnerId: string
): PrivateMessage[] | null {
  try {
    const key = `${CACHE_PREFIX_MESSAGES}${streamId}_${partnerId}`;
    const cached = localStorage.getItem(key);

    if (!cached) return null;

    const data: CachedMessages = JSON.parse(cached);

    // Check if cache is expired
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }

    return data.messages;
  } catch (error) {
    console.error("Error reading private chat cache:", error);
    return null;
  }
}

/**
 * Cache messages for a conversation
 */
export function setCachedPrivateMessages(
  streamId: string,
  partnerId: string,
  messages: PrivateMessage[]
): void {
  try {
    const key = `${CACHE_PREFIX_MESSAGES}${streamId}_${partnerId}`;

    // Limit cached messages
    const limitedMessages = messages.slice(-MAX_CACHED_MESSAGES);

    const data: CachedMessages = {
      messages: limitedMessages,
      timestamp: Date.now(),
      streamId,
      partnerId,
    };

    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error caching private messages:", error);
    clearOldPrivateCaches();
  }
}

/**
 * Get cached conversations
 */
export function getCachedConversations(
  streamId: string
): PrivateConversation[] | null {
  try {
    const key = `${CACHE_PREFIX_CONVERSATIONS}${streamId}`;
    const cached = localStorage.getItem(key);

    if (!cached) return null;

    const data: CachedConversations = JSON.parse(cached);

    // Check if cache is expired
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }

    return data.conversations;
  } catch (error) {
    console.error("Error reading conversations cache:", error);
    return null;
  }
}

/**
 * Cache conversations
 */
export function setCachedConversations(
  streamId: string,
  conversations: PrivateConversation[]
): void {
  try {
    const key = `${CACHE_PREFIX_CONVERSATIONS}${streamId}`;

    const data: CachedConversations = {
      conversations,
      timestamp: Date.now(),
      streamId,
    };

    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error caching conversations:", error);
    clearOldPrivateCaches();
  }
}

/**
 * Add a message to the cache
 */
export function addPrivateMessageToCache(
  streamId: string,
  partnerId: string,
  message: PrivateMessage
): void {
  try {
    const cached = getCachedPrivateMessages(streamId, partnerId);
    if (!cached) return;

    // Check if message already exists
    if (cached.some((m) => m.id === message.id)) return;

    const updatedMessages = [...cached, message].slice(-MAX_CACHED_MESSAGES);
    setCachedPrivateMessages(streamId, partnerId, updatedMessages);
  } catch (error) {
    console.error("Error adding private message to cache:", error);
  }
}

/**
 * Clear all expired caches
 */
export function clearOldPrivateCaches(): void {
  try {
    const now = Date.now();
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (
        key.startsWith(CACHE_PREFIX_MESSAGES) ||
        key.startsWith(CACHE_PREFIX_CONVERSATIONS)
      ) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const data = JSON.parse(cached);
            if (now - data.timestamp > CACHE_DURATION) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error("Error clearing old private caches:", error);
  }
}

/**
 * Clear cache for a specific conversation
 */
export function clearPrivateMessageCache(
  streamId: string,
  partnerId: string
): void {
  try {
    const key = `${CACHE_PREFIX_MESSAGES}${streamId}_${partnerId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing private message cache:", error);
  }
}

// Clear old caches on module load
if (typeof window !== "undefined") {
  clearOldPrivateCaches();
}
