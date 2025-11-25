import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// GET /api/streams/[streamId]/chat-requests - Fetch pending chat requests (for creators)
// POST /api/streams/[streamId]/chat-requests - Send a new chat request (for viewers)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const { streamId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the stream to check if user is the creator
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { creatorId: true },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Only creators can fetch pending requests for their stream
    if (stream.creatorId !== userId) {
      return NextResponse.json(
        { error: "Only creators can view chat requests" },
        { status: 403 }
      );
    }

    // Fetch pending chat requests
    const requests = await prisma.privateChatRequest.findMany({
      where: {
        streamId,
        receiverId: userId,
        status: "PENDING",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
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
    });

    const formattedRequests = requests.map((request) => ({
      id: request.id,
      senderId: request.senderId,
      senderName: request.sender.profile?.displayName || "Anonymous",
      senderImage: request.sender.profile?.avatarUrl,
      senderRole: request.sender.role,
      initialMessage: request.initialMessage,
      createdAt: request.createdAt,
      expiresAt: request.expiresAt,
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Error fetching chat requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const { streamId } = await params;
    const { receiverId, initialMessage } = await request.json();

    // Verify JWT token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: { userId: string; streamId: string; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        streamId: string;
        role: string;
      };
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const senderId = decoded.userId;

    // Verify stream exists
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { creator: true },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, role: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    // Check if a request already exists
    const existingRequest = await prisma.privateChatRequest.findUnique({
      where: {
        senderId_receiverId_streamId: {
          senderId,
          receiverId,
          streamId,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return NextResponse.json(
          { error: "Chat request already pending" },
          { status: 400 }
        );
      } else if (existingRequest.status === "ACCEPTED") {
        return NextResponse.json(
          { error: "Chat request already accepted" },
          { status: 400 }
        );
      } else if (existingRequest.status === "REJECTED") {
        // Allow sending a new request if previous was rejected
        // Update the existing request instead of creating new one
        const updatedRequest = await prisma.privateChatRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: "PENDING",
            initialMessage,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            respondedAt: null,
            updatedAt: new Date(),
          },
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
          },
        });

        return NextResponse.json({
          request: {
            id: updatedRequest.id,
            status: updatedRequest.status,
            createdAt: updatedRequest.createdAt,
          },
        });
      }
    }

    // Create new chat request with 7-day expiration
    const chatRequest = await prisma.privateChatRequest.create({
      data: {
        senderId,
        receiverId,
        streamId,
        initialMessage,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    return NextResponse.json({
      request: {
        id: chatRequest.id,
        status: chatRequest.status,
        createdAt: chatRequest.createdAt,
        expiresAt: chatRequest.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating chat request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
