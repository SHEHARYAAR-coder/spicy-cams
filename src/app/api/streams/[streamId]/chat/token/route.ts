import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import jwt from "jsonwebtoken";
import { canUserChat } from "@/lib/chat-server";
import { prisma } from "@/lib/prisma";

// If auth import fails, use this alternative:
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";
// Then replace: const session = await auth();
// With: const session = await getServerSession(authOptions);

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    // Get session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { streamId } = await params;
    const userId = session.user.id;

    // Check if stream exists and is live
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { id: true, status: true, creatorId: true },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.status !== "LIVE") {
      return NextResponse.json(
        { error: "Stream is not live" },
        { status: 400 }
      );
    }

    // Check if user can chat (balance, ban, mute checks)
    const chatCheck = await canUserChat(userId, streamId);

    if (!chatCheck.canChat) {
      return NextResponse.json(
        {
          canChat: false,
          reason: chatCheck.reason,
        },
        { status: 403 }
      );
    }

    // Determine user role for chat
    const isCreator = stream.creatorId === userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const chatRole = isCreator
      ? "creator"
      : user?.role === "MODERATOR" || user?.role === "ADMIN"
      ? "moderator"
      : "viewer";

    // Generate chat token (JWT)
    const token = jwt.sign(
      {
        userId,
        streamId,
        role: chatRole,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      },
      JWT_SECRET
    );

    return NextResponse.json({
      token,
      canChat: true,
      role: chatRole,
    });
  } catch (error) {
    console.error("Error generating chat token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
