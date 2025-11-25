import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// GET /api/streams/[streamId]/chat-requests/status - Check request status with a specific user

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const { streamId } = await params;
    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get("receiverId");

    if (!receiverId) {
      return NextResponse.json(
        { error: "receiverId is required" },
        { status: 400 }
      );
    }

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

    // Check for existing request
    const chatRequest = await prisma.privateChatRequest.findUnique({
      where: {
        senderId_receiverId_streamId: {
          senderId,
          receiverId,
          streamId,
        },
      },
    });

    if (!chatRequest) {
      return NextResponse.json({ status: "NONE" });
    }

    // Check if expired
    if (
      chatRequest.expiresAt &&
      chatRequest.expiresAt < new Date() &&
      chatRequest.status === "PENDING"
    ) {
      // Update to expired
      await prisma.privateChatRequest.update({
        where: { id: chatRequest.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ status: "EXPIRED" });
    }

    return NextResponse.json({ status: chatRequest.status });
  } catch (error) {
    console.error("Error checking request status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
