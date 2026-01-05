import { NextRequest, NextResponse } from "next/server";
import { getRecentMessages, storeChatMessage, canUserChat } from "@/lib/chat-server";
import { auth } from "@/lib/auth";
import { broadcastMessage } from "@/lib/chat-realtime";

// POST - Send a new chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { streamId } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { message, type } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message too long (max 500 characters)" },
        { status: 400 }
      );
    }

    // Check if user can chat (not banned, not muted, has credits)
    const chatCheck = await canUserChat(userId, streamId);
    if (!chatCheck.canChat) {
      return NextResponse.json(
        { error: chatCheck.reason || "You cannot send messages" },
        { status: 403 }
      );
    }

    // Store the message
    const chatMessage = await storeChatMessage(streamId, userId, message.trim());

    // Broadcast to all connected clients for real-time updates
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
        isTip: type === 'tip',
      },
      timestamp: new Date().toISOString(),
    };
    broadcastMessage(streamId, event);

    return NextResponse.json({
      success: true,
      message: {
        id: chatMessage.id,
        streamId: chatMessage.streamId,
        userId: chatMessage.userId,
        message: chatMessage.message,
        createdAt: chatMessage.createdAt.toISOString(),
        type: type || "message",
        user: {
          id: chatMessage.user.id,
          displayName: chatMessage.user.profile?.displayName || "Anonymous",
          avatarUrl: chatMessage.user.profile?.avatarUrl || null,
          role: chatMessage.user.role,
        },
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const { streamId } = await params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "100");
    const beforeId = searchParams.get("before") || undefined;

    // Validate limit
    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: "Invalid limit. Must be between 1 and 200." },
        { status: 400 }
      );
    }

    // Get messages
    const messages = await getRecentMessages(streamId, limit, beforeId);

    // Format messages for response
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      streamId: msg.streamId,
      userId: msg.userId,
      message: msg.message,
      isDeleted: msg.isDeleted,
      createdAt: msg.createdAt.toISOString(),
      user: {
        id: msg.user.id,
        displayName: msg.user.profile?.displayName || "Anonymous",
        avatarUrl: msg.user.profile?.avatarUrl || null,
        role: msg.user.role,
      },
    }));

    return NextResponse.json({
      messages: formattedMessages,
      count: formattedMessages.length,
      hasMore: formattedMessages.length === limit,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
