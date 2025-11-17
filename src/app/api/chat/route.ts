import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { validateMessage, RateLimiter, canUserChat } from "@/lib/chat-server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// Message batching for high-throughput scenarios
const messageBatchQueue = new Map<string, Array<unknown>>();
const batchTimers = new Map<string, NodeJS.Timeout>();
const BATCH_DELAY = 50; // milliseconds
const BATCH_SIZE = 10; // max messages per batch

function broadcastMessage(streamId: string, event: unknown) {
  const streamConnections = connections.get(streamId);
  if (!streamConnections) return;

  const eventStr = `data: ${JSON.stringify(event)}\n\n`;

  streamConnections.forEach((conn) => {
    try {
      conn.controller.enqueue(eventStr);
      // Update last activity on successful send
      conn.lastActivity = Date.now();
    } catch {
      // Client disconnected, will be cleaned up
    }
  });
}

// Store active connections by streamId
const connections = new Map<string, Set<{ userId: string; controller: ReadableStreamDefaultController; lastActivity: number }>>();

// Global rate limiter
const rateLimiter = new RateLimiter(10, 30);

// Cleanup rate limiter every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

// Cleanup stale connections every minute
setInterval(() => {
  const now = Date.now();
  const STALE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  
  connections.forEach((streamConnections, streamId) => {
    streamConnections.forEach((connection) => {
      if (now - connection.lastActivity > STALE_TIMEOUT) {
        try {
          connection.controller.close();
        } catch (err) {
          // Already closed
        }
        streamConnections.delete(connection);
      }
    });
    
    if (streamConnections.size === 0) {
      connections.delete(streamId);
    }
  });
}, 60 * 1000);

/**
 * SSE endpoint for real-time chat
 * GET /api/chat?token=xxx - Subscribe to chat events
 * POST /api/chat - Send a message
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response("Missing token", { status: 401 });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      streamId: string;
      role: string;
    };

    const { userId, streamId, role } = decoded;

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Register connection
        if (!connections.has(streamId)) {
          connections.set(streamId, new Set());
        }
        const connection = { userId, controller, lastActivity: Date.now() };
        connections.get(streamId)!.add(connection);

        // Send initial connection event
        const data = JSON.stringify({
          type: "connection",
          status: "connected",
          role,
          timestamp: new Date().toISOString(),
        });
        controller.enqueue(`data: ${data}\n\n`);

        // Send heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(`: heartbeat\n\n`);
            connection.lastActivity = Date.now();
          } catch {
            clearInterval(heartbeat);
          }
        }, 30000);

        // Cleanup on close
        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          connections.get(streamId)?.delete(connection);
          if (connections.get(streamId)?.size === 0) {
            connections.delete(streamId);
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("SSE connection error:", error);
    return new Response("Invalid token", { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, message } = body;

    if (!token || !message) {
      return Response.json(
        { error: "Missing token or message" },
        { status: 400 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      streamId: string;
      role: string;
    };

    const { userId, streamId } = decoded;

    // Check if user can still chat
    const chatCheck = await canUserChat(userId, streamId);
    if (!chatCheck.canChat) {
      return Response.json(
        { error: chatCheck.reason },
        { status: 403 }
      );
    }

    // Rate limiting
    if (!rateLimiter.canSend(userId)) {
      const resetSeconds = rateLimiter.getResetSeconds(userId);
      return Response.json(
        {
          error: "Rate limit exceeded",
          resetIn: resetSeconds,
        },
        { status: 429 }
      );
    }

    // Validate message
    const validation = validateMessage(message);
    if (!validation.isValid) {
      return Response.json(
        { error: validation.reason },
        { status: 400 }
      );
    }

    // Determine if user is the stream creator (exempt from debit)
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { creatorId: true },
    });
    if (!stream) {
      return Response.json({ error: "Stream not found" }, { status: 404 });
    }

    const isCreator = stream.creatorId === userId;

    // Atomically handle debit (if needed) and message creation
    const chatMessage = await prisma.$transaction(async (tx) => {
      // For non-creators, ensure balance and debit 1 credit
      if (!isCreator) {
        // Conditionally debit only if balance >= 1 to avoid negative balances
        const debit = await tx.wallet.updateMany({
          where: { userId, balance: { gte: new Prisma.Decimal(1) } },
          data: { balance: { decrement: new Prisma.Decimal(1) } },
        });

        if (debit.count === 0) {
          throw new Error("INSUFFICIENT_CREDITS");
        }

        // Fetch updated balance for ledger entry
        const updatedWallet = await tx.wallet.findUnique({
          where: { userId },
          select: { balance: true },
        });

        // Create the message and reference it in the ledger entry
        const createdMessage = await tx.chatMessage.create({
          data: {
            streamId,
            userId,
            message: validation.sanitized!,
          },
          include: {
            user: {
              select: {
                id: true,
                role: true,
                profile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        });

        await tx.ledgerEntry.create({
          data: {
            userId,
            type: "DEBIT",
            amount: new Prisma.Decimal(1),
            currency: "USD",
            balanceAfter: updatedWallet!.balance,
            referenceType: "CHAT_MESSAGE",
            referenceId: createdMessage.id,
            description: "Public chat message debit",
          },
        });

        return createdMessage;
      }

      // Creator path: just create the message without debit
      const createdMessage = await tx.chatMessage.create({
        data: {
          streamId,
          userId,
          message: validation.sanitized!,
        },
        include: {
          user: {
            select: {
              id: true,
              role: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      });
      return createdMessage;
    }).catch((err) => {
      if (err instanceof Error && err.message === "INSUFFICIENT_CREDITS") {
        return null;
      }
      throw err;
    });

    if (!chatMessage) {
      return Response.json(
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    // Increment rate limit
    rateLimiter.increment(userId);

    // Broadcast to all connected clients using optimized broadcast
    const event = {
      type: "message",
      data: {
        id: chatMessage.id,
        message: chatMessage.message,
        userId: chatMessage.userId,
        user: {
          id: chatMessage.user.id,
          displayName: chatMessage.user.profile?.displayName || "Anonymous",
          avatarUrl: chatMessage.user.profile?.avatarUrl,
          role: chatMessage.user.role,
        },
        createdAt: chatMessage.createdAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    broadcastMessage(streamId, event);

    return Response.json({
      success: true,
      messageId: chatMessage.id,
      remaining: rateLimiter.getRemaining(userId),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return Response.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Broadcast moderation event to stream (called by moderation API)
 */
export function broadcastModerationEvent(
  streamId: string,
  event: {
    type: "delete" | "mute" | "ban";
    targetUserId?: string;
    messageId?: string;
    duration?: number;
  }
) {
  const moderationEvent = {
    type: "moderation",
    data: event,
    timestamp: new Date().toISOString(),
  };

  broadcastMessage(streamId, moderationEvent);
}
