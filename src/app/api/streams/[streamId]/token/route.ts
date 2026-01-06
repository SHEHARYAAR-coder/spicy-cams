import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import {
  generateCreatorToken,
  generateViewerToken,
  getRoomNameFromStreamId,
  getLiveKitWsUrl,
} from "@/lib/livekit";

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    streamId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { streamId } = await params;

    // Get stream and user details
    const [stream, user] = await Promise.all([
      prisma.stream.findUnique({
        where: { id: streamId },
        include: { model: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          wallet: true,
          profile: true,
        },
      }),
    ]);

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if stream is live
    if (stream.status !== "LIVE" && stream.status !== "SCHEDULED") {
      return NextResponse.json(
        {
          error: "Stream is not available for viewing",
        },
        { status: 400 }
      );
    }

    const roomName = getRoomNameFromStreamId(streamId);
    let token: string;
    let role: "creator" | "viewer";

    // model
    if (stream.modelId === user.id) {
      // Model gets publish permissions
      token = await generateCreatorToken(roomName, user.id);
      role = "creator";
    } else {
      // Viewers need credits to watch (minimum 1 credit)
      const wallet = user.wallet;
      const balance = wallet ? Number(wallet.balance) : 0;
      if (!wallet || balance < 1) {
        return NextResponse.json(
          {
            error: "Insufficient credits to watch stream",
            code: "INSUFFICIENT_CREDITS",
            balance: balance,
          },
          { status: 402 }
        );
      }

      // Generate viewer token (subscribe-only)
      token = await generateViewerToken(roomName, user.id);
      role = "viewer";
    }

    return NextResponse.json({
      token,
      role,
      roomConfig: {
        serverUrl: getLiveKitWsUrl(),
        roomName,
        participantName: user.profile?.displayName || user.email,
      },
      stream: {
        id: stream.id,
        title: stream.title,
        category: stream.category,
        status: stream.status,
      },
      user: {
        id: user.id,
        role: user.role,
        balance: user.wallet?.balance ? Number(user.wallet.balance) : 0,
      },
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate access token",
      },
      { status: 500 }
    );
  }
}
