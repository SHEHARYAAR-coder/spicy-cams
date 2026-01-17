import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const models = await prisma.user.findMany({
      where: {
        role: "MODEL",
        status: "ACTIVE",
        ...(search && {
          OR: [
            {
              profile: {
                displayName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }),
        ...(category && {
          profile: {
            category: category,
          },
        }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            bio: true,
            category: true,
            language: true,
            hairColor: true,
            physique: true,
            breastSize: true,
            displayedAge: true,
            spokenLanguages: true,
            relationship: true,
            ethnicity: true,
            displayedCity: true,
            myShows: true,
          },
        },
        _count: {
          select: {
            followers: true,
            streams: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      models: models.map((model) => ({
        id: model.id,
        username: model.username,
        email: model.email,
        displayName: model.profile?.displayName || model.email.split("@")[0],
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
        followersCount: model._count.followers,
        streamsCount: model._count.streams,
        createdAt: model.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch models",
      },
      { status: 500 }
    );
  }
}
