import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;

    // Try to find model by username first, then by ID
    const model = await prisma.user.findFirst({
      where: {
        OR: [
          { username: modelId },
          { id: modelId }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            isModel: true,
            displayName: true,
            avatarUrl: true,
            coverUrl: true,
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

    if (!model) {
      return NextResponse.json(
        {
          success: false,
          error: "Model not found",
        },
        { status: 404 }
      );
    }

    // Check if the user is actually a model
    if (!model.profile?.isModel) {
      return NextResponse.json(
        {
          success: false,
          error: "User is not a model",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      model: {
        id: model.id,
        username: model.username,
        email: model.email,
        role: model.role,
        status: model.status,
        displayName:
          model.profile?.displayName || model.email.split("@")[0],
        avatarUrl: model.profile?.avatarUrl,
        coverUrl: model.profile?.coverUrl,
        bio: model.profile?.bio,
        category: model.profile?.category,
        language: model.profile?.language,
        hairColor: model.profile?.hairColor,
        physique: model.profile?.physique,
        breastSize: model.profile?.breastSize,
        pubicHair: model.profile?.pubicHair,
        displayedAge: model.profile?.displayedAge,
        spokenLanguages: model.profile?.spokenLanguages || [],
        relationship: model.profile?.relationship,
        ethnicity: model.profile?.ethnicity,
        piercings: model.profile?.piercings,
        tattoos: model.profile?.tattoos,
        displayedCity: model.profile?.displayedCity,
        myShows: model.profile?.myShows || [],
        profileDescription: model.profile?.profileDescription,
        profileImages: model.profile?.profileImages || [],
        profileVideos: model.profile?.profileVideos || [],
        followersCount: model._count.followers,
        streamsCount: model._count.streams,
        createdAt: model.createdAt,
        streams: model.streams,
      },
    });
  } catch (error) {
    console.error("Error fetching model:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch model",
      },
      { status: 500 }
    );
  }
}
