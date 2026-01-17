import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get("period") || "all-time"; // 'week', 'month', 'all-time'
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const category = searchParams.get("category");

    // Calculate date range based on period
    let dateFilter: Date | undefined;
    const now = new Date();
    
    if (period === "week") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build where clause for streams
    const streamWhere: Record<string, unknown> = {
      status: { in: ["LIVE", "ENDED"] },
    };

    if (dateFilter) {
      streamWhere.createdAt = { gte: dateFilter };
    }

    if (category) {
      streamWhere.category = category;
    }

    // Fetch models with their stream statistics
    const modelsWithStats = await prisma.user.findMany({
      where: {
        role: "MODEL",
        status: "ACTIVE",
        profile: {
          isModel: true,
          verificationStatus: "approved",
        },
      },
      include: {
        profile: true,
        streams: {
          where: streamWhere,
          include: {
            sessions: {
              select: {
                id: true,
                totalWatchMs: true,
              },
            },
          },
        },
        followers: {
          select: {
            id: true,
          },
        },
      },
    });

    // Calculate statistics for each model
    const modelsWithCalculatedStats = modelsWithStats.map((model) => {
      const streamsCount = model.streams.length;
      
      // Calculate total viewers (unique sessions across all streams)
      const totalViewers = model.streams.reduce((acc, stream) => {
        return acc + stream.sessions.length;
      }, 0);

      // Calculate total watch time in hours
      const totalWatchTimeMs = model.streams.reduce((acc, stream) => {
        return acc + stream.sessions.reduce((sessAcc, session) => {
          return sessAcc + session.totalWatchMs;
        }, 0);
      }, 0);
      const totalWatchTimeHours = Math.round(totalWatchTimeMs / (1000 * 60 * 60));

      // Calculate average viewers per stream
      const avgViewersPerStream = streamsCount > 0 
        ? Math.round(totalViewers / streamsCount) 
        : 0;

      return {
        id: model.id,
        username: model.username,
        displayName: model.profile?.displayName || "Anonymous",
        avatarUrl: model.profile?.avatarUrl,
        bio: model.profile?.bio,
        category: model.profile?.category,
        language: model.profile?.language,
        hairColor: model.profile?.hairColor,
        physique: model.profile?.physique,
        breastSize: model.profile?.breastSize,
        displayedAge: model.profile?.displayedAge,
        spokenLanguages: model.profile?.spokenLanguages || [],
        relationship: model.profile?.relationship,
        ethnicity: model.profile?.ethnicity,
        displayedCity: model.profile?.displayedCity,
        myShows: model.profile?.myShows || [],
        followersCount: model.followers.length,
        streamsCount,
        totalViewers,
        totalWatchTimeHours,
        avgViewersPerStream,
        createdAt: model.createdAt,
        // Score for ranking (weighted combination of metrics)
        rankScore: (streamsCount * 10) + (totalViewers * 2) + (model.followers.length * 5),
      };
    });

    // Sort by rank score (highest first)
    const sortedModels = modelsWithCalculatedStats
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, limit);

    return NextResponse.json({
      models: sortedModels,
      period,
      total: sortedModels.length,
    });

  } catch (error) {
    console.error("Error fetching top models:", error);
    return NextResponse.json(
      { error: "Failed to fetch top models" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
