import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/streams/[streamId]/likes
 * Get likes count and current user's like status for a stream
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const { streamId } = await params;
    const session = await auth();

    // Get total likes count
    const likesCount = await prisma.streamLike.count({
      where: { streamId },
    });

    // Check if current user has liked (if authenticated)
    let isLikedByUser = false;
    if (session?.user?.id) {
      const userLike = await prisma.streamLike.findUnique({
        where: {
          streamId_userId: {
            streamId,
            userId: session.user.id,
          },
        },
      });
      isLikedByUser = !!userLike;
    }

    return NextResponse.json({
      success: true,
      likesCount,
      isLikedByUser,
    });
  } catch (error) {
    console.error("Error fetching stream likes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stream likes",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/streams/[streamId]/likes
 * Like a stream (toggle - if already liked, unlike it)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const { streamId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if stream exists
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { id: true, status: true },
    });

    if (!stream) {
      return NextResponse.json(
        {
          success: false,
          error: "Stream not found",
        },
        { status: 404 }
      );
    }

    // Check if user already liked this stream
    const existingLike = await prisma.streamLike.findUnique({
      where: {
        streamId_userId: {
          streamId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike - remove the like
      await prisma.streamLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Get updated count
      const likesCount = await prisma.streamLike.count({
        where: { streamId },
      });

      return NextResponse.json({
        success: true,
        action: "unliked",
        likesCount,
        isLikedByUser: false,
      });
    } else {
      // Like - create new like
      await prisma.streamLike.create({
        data: {
          streamId,
          userId,
        },
      });

      // Get updated count
      const likesCount = await prisma.streamLike.count({
        where: { streamId },
      });

      return NextResponse.json({
        success: true,
        action: "liked",
        likesCount,
        isLikedByUser: true,
      });
    }
  } catch (error) {
    console.error("Error liking stream:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to like stream",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/streams/[streamId]/likes
 * Unlike a stream
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const { streamId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Find and delete the like
    const existingLike = await prisma.streamLike.findUnique({
      where: {
        streamId_userId: {
          streamId,
          userId,
        },
      },
    });

    if (!existingLike) {
      return NextResponse.json(
        {
          success: false,
          error: "Like not found",
        },
        { status: 404 }
      );
    }

    await prisma.streamLike.delete({
      where: {
        id: existingLike.id,
      },
    });

    // Get updated count
    const likesCount = await prisma.streamLike.count({
      where: { streamId },
    });

    return NextResponse.json({
      success: true,
      action: "unliked",
      likesCount,
      isLikedByUser: false,
    });
  } catch (error) {
    console.error("Error unliking stream:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to unlike stream",
      },
      { status: 500 }
    );
  }
}
