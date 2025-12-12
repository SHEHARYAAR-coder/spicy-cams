import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateMessage } from "@/lib/chat-server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";
const INBOX_STREAM_ID = "inbox-global"; // Placeholder streamId for inbox messages

// GET /api/inbox/messages/[userId] - Fetch conversation history with a specific user across all contexts
// POST /api/inbox/messages/[userId] - Send private message to a user (inbox context)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: partnerId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get conversation history between current user and partner across ALL streams
    const messages = await prisma.privateMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
        isDeleted: false,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to recent 100 messages
    });

    // Mark messages as read if they were sent to current user
    await prisma.privateMessage.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const formattedMessages = messages.reverse().map((message) => ({
      id: message.id,
      message: message.message,
      senderId: message.senderId,
      receiverId: message.receiverId,
      createdAt: message.createdAt,
      isRead: message.isRead,
      sender: {
        id: message.sender.id,
        name: message.sender.profile?.displayName || "Anonymous",
        image: message.sender.profile?.avatarUrl,
        role: message.sender.role,
      },
    }));

    return NextResponse.json({
      messages: formattedMessages,
      requestStatus: "ACCEPTED", // Inbox doesn't require chat requests
    });
  } catch (error) {
    console.error("Error fetching inbox messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: receiverId } = await params;
    if (!receiverId || receiverId === "undefined") {
      return NextResponse.json(
        { error: "Invalid receiver specified" },
        { status: 400 }
      );
    }
    const { message } = await request.json();

    // Verify JWT token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: { userId: string; streamId?: string; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        streamId?: string;
        role: string;
      };
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const senderId = decoded.userId;

    // Validate message
    const validationResult = validateMessage(message);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.reason },
        { status: 400 }
      );
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, status: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    if (receiver.status === "BANNED" || receiver.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Cannot send message to this user" },
        { status: 403 }
      );
    }

    // Verify sender exists
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, status: true, profile: true },
    });

    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    if (sender.status === "BANNED" || sender.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Cannot send messages while banned or suspended" },
        { status: 403 }
      );
    }

    // For inbox, we need a streamId - use a special placeholder or find/create a virtual stream
    // Option 1: Use a consistent placeholder streamId
    let streamId = INBOX_STREAM_ID;

    // Check if there's already a stream context between these users
    const existingMessage = await prisma.privateMessage.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      select: { streamId: true },
      orderBy: { createdAt: "desc" },
    });

    // If there's an existing conversation, use that streamId to maintain context
    if (existingMessage) {
      streamId = existingMessage.streamId;
    } else {
      // For new conversations, check if we need to create/verify the placeholder stream
      const placeholderStream = await prisma.stream.findUnique({
        where: { id: INBOX_STREAM_ID },
      });

      if (!placeholderStream) {
        // Create a placeholder stream for inbox messages
        // We'll use the sender as the model for the placeholder
        await prisma.stream.create({
          data: {
            id: INBOX_STREAM_ID,
            title: "Inbox Messages",
            modelId: senderId, // Just a placeholder
            status: "ENDED", // Not an active stream
          },
        });
      }
    }

    // Create the private message
    const privateMessage = await prisma.privateMessage.create({
      data: {
        senderId,
        receiverId,
        streamId,
        message: message.trim(),
        isRead: false,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!privateMessage) {
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: {
        id: privateMessage.id,
        message: privateMessage.message,
        senderId: privateMessage.senderId,
        receiverId: privateMessage.receiverId,
        createdAt: privateMessage.createdAt,
        isRead: privateMessage.isRead,
        sender: {
          id: privateMessage.sender.id,
          name: privateMessage.sender.profile?.displayName || "Anonymous",
          image: privateMessage.sender.profile?.avatarUrl,
          role: privateMessage.sender.role,
        },
      },
    });
  } catch (error) {
    console.error("Error sending inbox message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
