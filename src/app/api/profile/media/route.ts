import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch profile media for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");
    const userId = searchParams.get("userId");
    
    if (!profileId && !userId) {
      return NextResponse.json(
        { error: "profileId or userId is required" },
        { status: 400 }
      );
    }

    const session = await auth();
    const isOwner = session?.user?.id === userId;

    let profile;
    if (profileId) {
      profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { id: true, userId: true },
      });
    } else if (userId) {
      profile = await prisma.profile.findUnique({
        where: { userId: userId },
        select: { id: true, userId: true },
      });
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if profileMedia table exists (migration applied)
    let media: any[] = [];
    try {
      // Fetch ALL media for this profile
      // We'll show everything but blur private content that hasn't been unlocked
      const where: any = { profileId: profile.id };

      media = await prisma.profileMedia.findMany({
        where,
        include: {
          unlockedByUsers: session?.user?.id ? {
            where: { userId: session.user.id },
            select: { id: true, createdAt: true }
          } : false
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (dbError) {
      console.error("Database error fetching profileMedia:", dbError);
      // If table doesn't exist yet or Prisma model not recognized, return empty array
      media = [];
    }

    const formattedMedia = media.map((item: any) => ({
      ...item,
      isUnlocked: isOwner || item.isPublic || (item.unlockedByUsers && item.unlockedByUsers.length > 0)
    }));

    return NextResponse.json({ media: formattedMedia, isOwner });
  } catch (error) {
    console.error("Error fetching profile media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST: Create new profile media
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, type, isPublic, tokenCost, fileName, fileSize, mimeType } = body;

    if (!url || !type) {
      return NextResponse.json(
        { error: "url and type are required" },
        { status: 400 }
      );
    }

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isModel: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.isModel) {
      return NextResponse.json(
        { error: "Only models can upload profile media" },
        { status: 403 }
      );
    }

    // Get current max sort order
    const maxSortOrder = await prisma.profileMedia.findFirst({
      where: { profileId: profile.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const media = await prisma.profileMedia.create({
      data: {
        profileId: profile.id,
        url,
        type: type.toUpperCase(),
        isPublic: isPublic !== undefined ? isPublic : true,
        tokenCost: tokenCost || 10,
        fileName,
        fileSize,
        mimeType,
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({ media });
  } catch (error) {
    console.error("Error creating profile media:", error);
    return NextResponse.json(
      { error: "Failed to create media" },
      { status: 500 }
    );
  }
}

// PATCH: Update media privacy settings
export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mediaId, isPublic, tokenCost, sortOrder } = body;

    if (!mediaId) {
      return NextResponse.json(
        { error: "mediaId is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const media = await prisma.profileMedia.findUnique({
      where: { id: mediaId },
      include: {
        profile: {
          select: { userId: true },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (media.profile.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own media" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (tokenCost !== undefined) updateData.tokenCost = tokenCost;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updatedMedia = await prisma.profileMedia.update({
      where: { id: mediaId },
      data: updateData,
    });

    return NextResponse.json({ media: updatedMedia });
  } catch (error) {
    console.error("Error updating media:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE: Remove media
export async function DELETE(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get("mediaId");

    if (!mediaId) {
      return NextResponse.json(
        { error: "mediaId is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const media = await prisma.profileMedia.findUnique({
      where: { id: mediaId },
      include: {
        profile: {
          select: { userId: true },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (media.profile.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own media" },
        { status: 403 }
      );
    }

    await prisma.profileMedia.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
