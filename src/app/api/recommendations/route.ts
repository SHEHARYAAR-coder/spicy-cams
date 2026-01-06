import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StreamStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category"); // girls, couples, guys, trans

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user's watch history to get preferences
    const watchHistory = await prisma.watchHistory.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        watchedAt: "desc",
      },
      take: 20,
      include: {
        stream: {
          select: {
            category: true,
            tags: true,
          },
        },
      },
    });

    // Extract categories and tags from watch history
    const watchedCategories = watchHistory
      .map((h: { stream: { category: string | null } }) => h.stream.category)
      .filter((c): c is string => c !== null);

    // Build query for recommendations
    const whereClause: { status: StreamStatus; category?: { in: string[] } | { contains: string; mode: "insensitive" }; OR?: Array<{ category: { contains: string; mode: "insensitive" } }> } = {
      status: StreamStatus.LIVE,
    };

    // Apply category filter if provided
    if (category) {
      const categoryLower = category.toLowerCase();
      whereClause.OR = [
        { category: { contains: categoryLower, mode: "insensitive" } },
        { category: { contains: categoryLower === "girls" ? "girl" : categoryLower, mode: "insensitive" } },
      ];

      if (categoryLower === "trans") {
        whereClause.OR.push(
          { category: { contains: "transgender", mode: "insensitive" } },
          { category: { contains: "transgirl", mode: "insensitive" } },
          { category: { contains: "transguy", mode: "insensitive" } }
        );
      }
    } else if (watchedCategories.length > 0) {
      // If no category specified, use watch history preferences
      whereClause.category = {
        in: watchedCategories,
      };
    }

    // Fetch recommended streams
    const recommendedStreams = await prisma.stream.findMany({
      where: whereClause,
      include: {
        model: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
      ],
      take: 20,
    });

    // If not enough recommendations, fetch popular streams
    let streams = recommendedStreams;
    if (streams.length < 10) {
      const popularStreams = await prisma.stream.findMany({
        where: {
          status: StreamStatus.LIVE,
          ...(category
            ? {
                OR: [
                  { category: { contains: category, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          model: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: [
          { createdAt: "desc" },
        ],
        take: 20,
      });

      // Merge and deduplicate
      const streamIds = new Set(streams.map((s) => s.id));
      const additionalStreams = popularStreams.filter(
        (s) => !streamIds.has(s.id)
      );
      streams = [...streams, ...additionalStreams];
    }

    // Transform streams to match expected format
    const transformedStreams = streams.map((stream) => ({
      ...stream,
      model: {
        id: stream.model.id,
        name: stream.model.profile?.displayName || stream.model.email,
        avatar: stream.model.profile?.avatarUrl,
      },
    }));

    return NextResponse.json({ streams: transformedStreams });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
