import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const creators = await prisma.user.findMany({
      where: {
        profile: {
          isCreator: true,
        },
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
      creators: creators.map((creator) => ({
        id: creator.id,
        email: creator.email,
        displayName: creator.profile?.displayName || creator.email.split("@")[0],
        avatarUrl: creator.profile?.avatarUrl,
        bio: creator.profile?.bio,
        category: creator.profile?.category,
        language: creator.profile?.language,
        hairColor: creator.profile?.hairColor,
        physique: creator.profile?.physique,
        breastSize: creator.profile?.breastSize,
        displayedAge: creator.profile?.displayedAge,
        spokenLanguages: creator.profile?.spokenLanguages || [],
        relationship: creator.profile?.relationship,
        ethnicity: creator.profile?.ethnicity,
        displayedCity: creator.profile?.displayedCity,
        myShows: creator.profile?.myShows || [],
        followersCount: creator._count.followers,
        streamsCount: creator._count.streams,
        createdAt: creator.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching creators:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch creators",
      },
      { status: 500 }
    );
  }
}
