import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch user's watch history
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch watch history from database
    const watchHistory = await prisma.watchHistory.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        watchedAt: "desc",
      },
      take: 50, // Limit to last 50 watched streams
      include: {
        stream: {
          include: {
            model: {
              select: {
                id: true,
                email: true,
              },
              include: {
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const streams = watchHistory.map((history: { stream: { model: { id: string; email: string; profile?: { displayName: string | null; avatarUrl: string | null } | null } }; watchedAt: Date }) => ({
      ...history.stream,
      watchedAt: history.watchedAt,
      model: {
        id: history.stream.model.id,
        name: history.stream.model.profile?.displayName || history.stream.model.email,
        avatar: history.stream.model.profile?.avatarUrl,
      },
    }));

    return NextResponse.json({ streams });
  } catch (error) {
    console.error("Error fetching watch history:", error);
    return NextResponse.json(
      { error: "Failed to fetch watch history" },
      { status: 500 }
    );
  }
}

// POST - Add stream to watch history
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { streamId } = await request.json();

    if (!streamId) {
      return NextResponse.json(
        { error: "Stream ID is required" },
        { status: 400 }
      );
    }

    // Check if stream exists
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return NextResponse.json(
        { error: "Stream not found" },
        { status: 404 }
      );
    }

    // Upsert watch history (update if exists, create if not)
    const watchHistory = await prisma.watchHistory.upsert({
      where: {
        userId_streamId: {
          userId: session.user.id,
          streamId: streamId,
        },
      },
      update: {
        watchedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        streamId: streamId,
        watchedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, watchHistory });
  } catch (error) {
    console.error("Error saving watch history:", error);
    return NextResponse.json(
      { error: "Failed to save watch history" },
      { status: 500 }
    );
  }
}
