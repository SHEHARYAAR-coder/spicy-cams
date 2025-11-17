import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createRoom, getRoomNameFromStreamId } from "@/lib/livekit";

const prisma = new PrismaClient();

const createStreamSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  tags: z.array(z.string().min(1).max(20)).max(10).optional().default([]),
  thumbnailUrl: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is creator or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });

    if (!user || (user.role !== "CREATOR" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Only creators can create streams" },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const { title, description, category, tags, thumbnailUrl, scheduledAt } =
      createStreamSchema.parse(body);

    // Check if user already has a live stream
    const existingLiveStream = await prisma.stream.findFirst({
      where: {
        creatorId: user.id,
        status: { in: ["SCHEDULED", "LIVE", "PAUSED"] },
      },
    });

    if (existingLiveStream) {
      return NextResponse.json(
        {
          error:
            "You already have an active stream. End it before creating a new one.",
        },
        { status: 409 }
      );
    }

    // Create stream record in database
    const stream = await prisma.stream.create({
      data: {
        creatorId: user.id,
        title,
        description: description || null,
        category,
        tags: tags || [],
        thumbnailUrl: thumbnailUrl || null,
        status: scheduledAt ? "SCHEDULED" : "LIVE",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        ingestUrl: "", // Will be set after LiveKit room creation
        playbackUrl: "", // Will be set after LiveKit room creation
      },
      include: {
        creator: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Create LiveKit room
    try {
      const roomName = getRoomNameFromStreamId(stream.id);
      await createRoom(roomName, { streamId: stream.id, creatorId: user.id });

      // Update stream with ingest and playback URLs
      const updatedStream = await prisma.stream.update({
        where: { id: stream.id },
        data: {
          ingestUrl: `${process.env.LIVEKIT_URL}/${roomName}`,
          playbackUrl: `${process.env.LIVEKIT_WS_URL}/${roomName}`,
        },
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
          description: updatedStream.description,
          category: updatedStream.category,
          tags: updatedStream.tags,
          thumbnailUrl: updatedStream.thumbnailUrl,
          status: updatedStream.status,
          ingestUrl: updatedStream.ingestUrl,
          playbackUrl: updatedStream.playbackUrl,
          roomName,
          creator: {
            id: updatedStream.creator.id,
            name:
              updatedStream.creator.profile?.displayName ||
              updatedStream.creator.email,
            avatar: updatedStream.creator.profile?.avatarUrl,
          },
          createdAt: updatedStream.createdAt,
        },
      });
    } catch (liveKitError) {
      // Clean up database record if LiveKit room creation fails
      await prisma.stream.delete({ where: { id: stream.id } });

      console.error("LiveKit room creation failed:", liveKitError);
      return NextResponse.json(
        {
          error: "Failed to create streaming room. Please try again.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Stream creation error:", error);

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
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
