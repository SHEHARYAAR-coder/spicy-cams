/**
 * Chat message caching utility
 * Uses localStorage for caching recent messages to improve load times
 */

import { ChatMessage } from "@/hooks/use-chat";

const CACHE_PREFIX = "chat_messages_";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHED_MESSAGES = 200;

interface CachedData {
  messages: ChatMessage[];
  timestamp: number;
  streamId: string;
}

/**
 * Get cached messages for a stream
 */
export function getCachedMessages(streamId: string): ChatMessage[] | null {
  try {
    const key = `${CACHE_PREFIX}${streamId}`;
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }

    return data.messages;
  } catch (error) {
    console.error("Error reading chat cache:", error);
    return null;
  }
}

/**
 * Cache messages for a stream
 */
export function setCachedMessages(streamId: string, messages: ChatMessage[]): void {
  try {
    const key = `${CACHE_PREFIX}${streamId}`;
    
    // Limit cached messages to prevent storage issues
    const limitedMessages = messages.slice(-MAX_CACHED_MESSAGES);
    
    const data: CachedData = {
      messages: limitedMessages,
      timestamp: Date.now(),
      streamId,
    };

    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error caching messages:", error);
    // If localStorage is full, clear old cache entries
    clearOldCaches();
  }
}

/**
 * Clear cache for a specific stream
 */
export function clearCachedMessages(streamId: string): void {
  try {
    const key = `${CACHE_PREFIX}${streamId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

/**
 * Clear all expired caches
 */
export function clearOldCaches(): void {
  try {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const data: CachedData = JSON.parse(cached);
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
    console.error("Error clearing old caches:", error);
  }
}

/**
 * Add a message to the cache without replacing all messages
 */
export function addMessageToCache(streamId: string, message: ChatMessage): void {
  try {
    const cached = getCachedMessages(streamId);
    if (!cached) return;

    // Check if message already exists
    if (cached.some(m => m.id === message.id)) return;

    const updatedMessages = [...cached, message].slice(-MAX_CACHED_MESSAGES);
    setCachedMessages(streamId, updatedMessages);
  } catch (error) {
    console.error("Error adding message to cache:", error);
  }
}

/**
 * Remove a message from the cache (e.g., when deleted)
 */
export function removeMessageFromCache(streamId: string, messageId: string): void {
  try {
    const cached = getCachedMessages(streamId);
    if (!cached) return;

    const updatedMessages = cached.filter(m => m.id !== messageId);
    setCachedMessages(streamId, updatedMessages);
  } catch (error) {
    console.error("Error removing message from cache:", error);
  }
}

// Clear old caches on module load
if (typeof window !== "undefined") {
  clearOldCaches();
}
