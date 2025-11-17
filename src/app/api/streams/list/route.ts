import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getRoomInfo, getRoomNameFromStreamId } from "@/lib/livekit";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get("status"); // 'live' | 'ended' | null (all)
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Build where clause
    const where: any = {};

    if (status === "live") {
      where.status = { in: ["LIVE", "PAUSED"] };
    } else if (status === "ended") {
      where.status = "ENDED";
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        {
          creator: {
            profile: { displayName: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    // Add cursor-based pagination
    const orderBy: any = [
      { startedAt: "desc" }, // Most recent first
      { createdAt: "desc" },
    ];

    let cursorCondition = {};
    if (cursor) {
      cursorCondition = {
        id: {
          lt: cursor,
        },
      };
    }

    // Fetch streams
    const streams = await prisma.stream.findMany({
      where: {
        ...where,
        ...cursorCondition,
      },
      include: {
        creator: {
          include: {
            profile: true,
          },
        },
      },
      orderBy,
      take: limit + 1, // Take one extra to determine if there are more
    });

    // Separate the extra item for pagination
    const hasMore = streams.length > limit;
    const results = hasMore ? streams.slice(0, -1) : streams;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    // For live streams, get participant counts from LiveKit
    const streamsWithParticipants = await Promise.all(
      results.map(async (stream) => {
        let participantCount = 0;

        if (stream.status === "LIVE") {
          try {
            const roomName = getRoomNameFromStreamId(stream.id);
            const roomInfo = await getRoomInfo(roomName);

            if (roomInfo) {
              participantCount = roomInfo.numParticipants;
            } else {
              // Room doesn't exist but stream says it's live - mark as ended
              await prisma.stream.update({
                where: { id: stream.id },
                data: { status: "ENDED", endedAt: new Date() },
              });
              // Update the stream object
              stream.status = "ENDED" as any;
            }
          } catch (error) {
            console.error(
              `Error getting room info for stream ${stream.id}:`,
              error
            );
          }
        }

        return {
          id: stream.id,
          title: stream.title,
          description: stream.description,
          category: stream.category,
          tags: stream.tags,
          status: stream.status,
          thumbnailUrl: stream.thumbnailUrl,
          participantCount,
          creator: {
            id: stream.creator.id,
            name: stream.creator.profile?.displayName || stream.creator.email,
            avatar: stream.creator.profile?.avatarUrl,
          },
          startedAt: stream.startedAt,
          endedAt: stream.endedAt,
          createdAt: stream.createdAt,
        };
      })
    );

    return NextResponse.json({
      streams: streamsWithParticipants,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    });
  } catch (error) {
    console.error("Stream list error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch streams",
      },
      { status: 500 }
    );
  }
}
