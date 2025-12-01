import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  try {
    const { creatorId } = await params;

    const creator = await prisma.user.findUnique({
      where: {
        id: creatorId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            isCreator: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            category: true,
            language: true,
            hairColor: true,
            physique: true,
            breastSize: true,
            pubicHair: true,
            displayedAge: true,
            spokenLanguages: true,
            relationship: true,
            ethnicity: true,
            piercings: true,
            tattoos: true,
            displayedCity: true,
            myShows: true,
            profileDescription: true,
            profileImages: true,
            profileVideos: true,
          },
        },
        _count: {
          select: {
            followers: true,
            streams: true,
          },
        },
        streams: {
          where: {
            status: {
              in: ["LIVE", "SCHEDULED"],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            thumbnailUrl: true,
            category: true,
            tags: true,
            createdAt: true,
            scheduledAt: true,
            startedAt: true,
          },
        },
      },
    });

    if (!creator) {
      return NextResponse.json(
        {
          success: false,
          error: "Creator not found",
        },
        { status: 404 }
      );
    }

    // Check if the user is actually a creator
    if (!creator.profile?.isCreator) {
      return NextResponse.json(
        {
          success: false,
          error: "User is not a creator",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      creator: {
        id: creator.id,
        email: creator.email,
        role: creator.role,
        status: creator.status,
        displayName:
          creator.profile?.displayName || creator.email.split("@")[0],
        avatarUrl: creator.profile?.avatarUrl,
        bio: creator.profile?.bio,
        category: creator.profile?.category,
        language: creator.profile?.language,
        hairColor: creator.profile?.hairColor,
        physique: creator.profile?.physique,
        breastSize: creator.profile?.breastSize,
        pubicHair: creator.profile?.pubicHair,
        displayedAge: creator.profile?.displayedAge,
        spokenLanguages: creator.profile?.spokenLanguages || [],
        relationship: creator.profile?.relationship,
        ethnicity: creator.profile?.ethnicity,
        piercings: creator.profile?.piercings,
        tattoos: creator.profile?.tattoos,
        displayedCity: creator.profile?.displayedCity,
        myShows: creator.profile?.myShows || [],
        profileDescription: creator.profile?.profileDescription,
        profileImages: creator.profile?.profileImages || [],
        profileVideos: creator.profile?.profileVideos || [],
        followersCount: creator._count.followers,
        streamsCount: creator._count.streams,
        createdAt: creator.createdAt,
        streams: creator.streams,
      },
    });
  } catch (error) {
    console.error("Error fetching creator:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch creator",
      },
      { status: 500 }
    );
  }
}
