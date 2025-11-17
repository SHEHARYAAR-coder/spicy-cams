import { prisma } from "@/lib/prisma";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  message: string;
  isDeleted: boolean;
  createdAt: Date;
  user: {
    id: string;
    profile: {
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
    role: string;
  };
}

export interface ChatEvent {
  type: "message" | "delete" | "mute" | "ban" | "connection";
  data: unknown;
  timestamp: Date;
}

export interface RateLimitInfo {
  count: number;
  resetAt: number;
}

// ============================================
// RATE LIMITER CLASS
// ============================================

export class RateLimiter {
  private limits: Map<string, RateLimitInfo>;
  private maxMessages: number;
  private windowSeconds: number;

  constructor(maxMessages: number = 10, windowSeconds: number = 30) {
    this.limits = new Map();
    this.maxMessages = maxMessages;
    this.windowSeconds = windowSeconds;
  }

  /**
   * Check if user can send a message
   */
  canSend(userId: string): boolean {
    const now = Date.now();
    const info = this.limits.get(userId);

    if (!info || now > info.resetAt) {
      // Reset or create new entry
      this.limits.set(userId, {
        count: 0,
        resetAt: now + this.windowSeconds * 1000,
      });
      return true;
    }

    return info.count < this.maxMessages;
  }

  /**
   * Increment message count for user
   */
  increment(userId: string): void {
    const now = Date.now();
    const info = this.limits.get(userId);

    if (!info || now > info.resetAt) {
      this.limits.set(userId, {
        count: 1,
        resetAt: now + this.windowSeconds * 1000,
      });
    } else {
      info.count++;
    }
  }

  /**
   * Get remaining messages for user
   */
  getRemaining(userId: string): number {
    const info = this.limits.get(userId);
    if (!info || Date.now() > info.resetAt) {
      return this.maxMessages;
    }
    return Math.max(0, this.maxMessages - info.count);
  }

  /**
   * Get seconds until rate limit resets
   */
  getResetSeconds(userId: string): number {
    const info = this.limits.get(userId);
    if (!info || Date.now() > info.resetAt) {
      return 0;
    }
    return Math.ceil((info.resetAt - Date.now()) / 1000);
  }

  /**
   * Clean up expired entries periodically
   */
  cleanup(): void {
    const now = Date.now();
    for (const [userId, info] of this.limits.entries()) {
      if (now > info.resetAt) {
        this.limits.delete(userId);
      }
    }
  }
}

// ============================================
// MESSAGE VALIDATION
// ============================================

const PROFANITY_PATTERNS = [
  /\b(fuck|shit|damn|bitch|asshole)\b/gi,
  // Add more patterns as needed
];

const SPAM_PATTERNS = [
  /(.)\1{10,}/, // Repeated characters
  /https?:\/\//gi, // URLs (optional, can be allowed)
];

/**
 * Validate message content
 */
export function validateMessage(message: string): {
  isValid: boolean;
  reason?: string;
  sanitized?: string;
} {
  // Check length
  if (!message || message.trim().length === 0) {
    return { isValid: false, reason: "Message cannot be empty" };
  }

  if (message.length > 500) {
    return { isValid: false, reason: "Message too long (max 500 characters)" };
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(message)) {
      return { isValid: false, reason: "Message contains spam patterns" };
    }
  }

  // Sanitize message (basic XSS protection)
  const sanitized = message
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();

  return { isValid: true, sanitized };
}

/**
 * Filter profanity from message (optional auto-moderation)
 */
export function filterProfanity(message: string): string {
  let filtered = message;
  for (const pattern of PROFANITY_PATTERNS) {
    filtered = filtered.replace(pattern, (match) => "*".repeat(match.length));
  }
  return filtered;
}

// ============================================
// BAN/MUTE CHECKS
// ============================================

/**
 * Check if user is banned globally or from specific stream
 */
export async function isUserBanned(
  userId: string,
  streamId?: string
): Promise<boolean> {
  const now = new Date();

  const banAction = await prisma.moderationAction.findFirst({
    where: {
      targetId: userId,
      targetType: "USER",
      action: "BAN",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  if (banAction) {
    return true;
  }

  // Check stream-specific ban if streamId provided
  if (streamId) {
    const streamBan = await prisma.moderationAction.findFirst({
      where: {
        targetId: userId,
        targetType: "USER",
        action: "BAN",
        reason: { contains: `stream:${streamId}` }, // Store stream-specific bans in reason
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    if (streamBan) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user is muted in a specific stream
 */
export async function isUserMuted(
  userId: string,
  streamId: string
): Promise<boolean> {
  const now = new Date();

  const muteAction = await prisma.moderationAction.findFirst({
    where: {
      targetId: userId,
      targetType: "USER",
      action: "MUTE",
      reason: { contains: `stream:${streamId}` },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  return !!muteAction;
}

/**
 * Check if user can chat in stream
 */
export async function canUserChat(
  userId: string,
  streamId: string
): Promise<{ canChat: boolean; reason?: string }> {
  // Check if banned
  const banned = await isUserBanned(userId, streamId);
  if (banned) {
    return { canChat: false, reason: "You are banned from chatting" };
  }

  // Check if muted
  const muted = await isUserMuted(userId, streamId);
  if (muted) {
    return { canChat: false, reason: "You are muted in this stream" };
  }

  // Creators are exempt from credit requirements in their own streams
  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
    select: { creatorId: true },
  });

  if (stream && stream.creatorId === userId) {
    return { canChat: true };
  }

  // Check wallet balance
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { balance: true },
  });

  if (!wallet || wallet.balance.lte(0)) {
    return {
      canChat: false,
      reason: "Chat requires credits. Please top up your balance.",
    };
  }

  return { canChat: true };
}

// ============================================
// CHAT MESSAGE HELPERS
// ============================================

/**
 * Store chat message in database
 */
export async function storeChatMessage(
  streamId: string,
  userId: string,
  message: string
): Promise<ChatMessage> {
  const chatMessage = await prisma.chatMessage.create({
    data: {
      streamId,
      userId,
      message,
    },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return chatMessage as ChatMessage;
}

/**
 * Get recent chat messages for a stream
 */
export async function getRecentMessages(
  streamId: string,
  limit: number = 100,
  beforeId?: string
): Promise<ChatMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: {
      streamId,
      ...(beforeId && { id: { lt: beforeId } }),
    },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return messages.reverse() as ChatMessage[];
}

/**
 * Delete chat message
 */
export async function deleteChatMessage(messageId: string): Promise<void> {
  await prisma.chatMessage.update({
    where: { id: messageId },
    data: { isDeleted: true },
  });
}

/**
 * Create moderation action
 */
export async function createModerationAction(data: {
  targetType: "USER" | "STREAM" | "MESSAGE";
  targetId: string;
  action: "MUTE" | "BAN" | "DELETE_MESSAGE" | "WARN";
  actorId: string;
  reason?: string;
  duration?: number; // in minutes
}): Promise<void> {
  const { targetType, targetId, action, actorId, reason, duration } = data;

  const expiresAt = duration
    ? new Date(Date.now() + duration * 60 * 1000)
    : null;

  await prisma.moderationAction.create({
    data: {
      targetType,
      targetId,
      action,
      actorId,
      reason,
      expiresAt,
    },
  });

  // If deleting message, mark it as deleted
  if (action === "DELETE_MESSAGE" && targetType === "MESSAGE") {
    await deleteChatMessage(targetId);
  }
}
