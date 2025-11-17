import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  deleteRoom,
  getRoomNameFromStreamId,
  getRoomInfo,
} from "@/lib/livekit";

const prisma = new PrismaClient();

const updateStreamSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  category: z.string().min(1).max(50).optional(),
  status: z.enum(["SCHEDULED", "LIVE", "PAUSED", "ENDED"]).optional(),
  thumbnailUrl: z.string().url().optional(),
});

interface RouteParams {
  params: Promise<{
    streamId: string;
  }>;
}

// GET - Public endpoint to get stream details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { streamId } = await params;

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        creator: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Get live status from LiveKit if stream is supposed to be live
    let liveStatus = stream.status;
    let participantCount = 0;

    if (stream.status === "LIVE") {
      const roomName = getRoomNameFromStreamId(streamId);
      const roomInfo = await getRoomInfo(roomName);

      if (!roomInfo) {
        // Room doesn't exist but stream says it's live - update status
        liveStatus = "ENDED";
        await prisma.stream.update({
          where: { id: streamId },
          data: { status: "ENDED", endedAt: new Date() },
        });
      } else {
        participantCount = roomInfo.numParticipants;
      }
    }

    return NextResponse.json({
      stream: {
        id: stream.id,
        title: stream.title,
        category: stream.category,
        status: liveStatus,
        thumbnailUrl: stream.thumbnailUrl,
        playbackUrl: stream.playbackUrl,
        participantCount,
        creator: {
          id: stream.creator.id,
          name: stream.creator.profile?.displayName || stream.creator.email,
          avatar: stream.creator.profile?.avatarUrl,
        },
        startedAt: stream.startedAt,
        endedAt: stream.endedAt,
        createdAt: stream.createdAt,
      },
    });
  } catch (error) {
    console.error("Stream fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update stream metadata (creator only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { streamId } = await params;
    const body = await request.json();
    const updates = updateStreamSchema.parse(body);

    // Check if stream exists and user owns it
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { creator: true },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Check authorization (creator or admin)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (stream.creatorId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle status changes
    const updateData: any = { ...updates };

    if (updates.status === "LIVE" && stream.status !== "LIVE") {
      updateData.startedAt = new Date();
      updateData.endedAt = null;
    } else if (updates.status === "ENDED" && stream.status !== "ENDED") {
      updateData.endedAt = new Date();
    }

    // Update stream
    const updatedStream = await prisma.stream.update({
      where: { id: streamId },
      data: updateData,
      include: {
        creator: {
          include: {
            profile: true,
          },
        },
      },
    });

    return NextResponse.json({
      stream: {
        id: updatedStream.id,
        title: updatedStream.title,
        category: updatedStream.category,
        status: updatedStream.status,
        thumbnailUrl: updatedStream.thumbnailUrl,
        playbackUrl: updatedStream.playbackUrl,
        creator: {
          id: updatedStream.creator.id,
          name:
            updatedStream.creator.profile?.displayName ||
            updatedStream.creator.email,
          avatar: updatedStream.creator.profile?.avatarUrl,
        },
        startedAt: updatedStream.startedAt,
        endedAt: updatedStream.endedAt,
        createdAt: updatedStream.createdAt,
      },
    });
  } catch (error) {
    console.error("Stream update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - End stream and close room (creator/admin)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { streamId } = await params;

    // Check if stream exists
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Check authorization (creator or admin)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (stream.creatorId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // End stream in database
    await prisma.stream.update({
      where: { id: streamId },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    });

    // Delete LiveKit room
    const roomName = getRoomNameFromStreamId(streamId);
    await deleteRoom(roomName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stream deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
