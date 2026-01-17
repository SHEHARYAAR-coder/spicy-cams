import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// POST: Unlock private media with tokens
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mediaId } = body;

    if (!mediaId) {
      return NextResponse.json(
        { error: "mediaId is required" },
        { status: 400 }
      );
    }

    // Get the media item
    const media = await prisma.profileMedia.findUnique({
      where: { id: mediaId },
      include: {
        profile: {
          select: { userId: true, user: true },
        },
        unlockedByUsers: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Check if media is public (no need to unlock)
    if (media.isPublic) {
      return NextResponse.json(
        { error: "This media is already public" },
        { status: 400 }
      );
    }

    // Check if user is the owner (owners don't need to unlock)
    if (media.profile.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot unlock your own media" },
        { status: 400 }
      );
    }

    // Check if already unlocked
    if (media.unlockedByUsers.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        message: "You have already unlocked this media",
      });
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Check if user has enough tokens
    const tokenCost = media.tokenCost;
    if (wallet.balance.lt(new Prisma.Decimal(tokenCost))) {
      return NextResponse.json(
        { error: "Insufficient tokens", required: tokenCost, balance: wallet.balance },
        { status: 402 }
      );
    }

    // Get user ID for transaction
    const userId = session.user!.id;

    // Perform the transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct tokens from viewer
      const updatedViewerWallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: tokenCost } },
      });

      // Add tokens to model
      const modelWallet = await tx.wallet.upsert({
        where: { userId: media.profile.userId },
        create: {
          userId: media.profile.userId,
          balance: tokenCost,
          currency: "USD",
        },
        update: {
          balance: { increment: tokenCost },
        },
      });

      // Create unlock record
      const unlock = await tx.mediaUnlock.create({
        data: {
          userId,
          mediaId: media.id,
          tokensPaid: tokenCost,
        },
      });

      // Create ledger entries
      await tx.ledgerEntry.create({
        data: {
          userId,
          type: "DEBIT",
          amount: -tokenCost,
          currency: "USD",
          balanceAfter: updatedViewerWallet.balance,
          referenceType: "media_unlock",
          referenceId: unlock.id,
          description: `Unlocked private media: ${media.fileName || media.id}`,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          userId: media.profile.userId,
          type: "DEPOSIT",
          amount: tokenCost,
          currency: "USD",
          balanceAfter: modelWallet.balance,
          referenceType: "media_unlock",
          referenceId: unlock.id,
          description: `Media unlocked by viewer`,
        },
      });

      return { unlock, newBalance: updatedViewerWallet.balance };
    });

    return NextResponse.json({
      success: true,
      unlock: result.unlock,
      newBalance: result.newBalance,
      message: "Media unlocked successfully",
    });
  } catch (error) {
    console.error("Error unlocking media:", error);
    return NextResponse.json(
      { error: "Failed to unlock media" },
      { status: 500 }
    );
  }
}

// GET: Check if user has unlocked specific media
export async function GET(req: NextRequest) {
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

    const unlock = await prisma.mediaUnlock.findUnique({
      where: {
        userId_mediaId: {
          userId: session.user.id,
          mediaId: mediaId,
        },
      },
    });

    return NextResponse.json({
      unlocked: !!unlock,
      unlockedAt: unlock?.createdAt,
    });
  } catch (error) {
    console.error("Error checking unlock status:", error);
    return NextResponse.json(
      { error: "Failed to check unlock status" },
      { status: 500 }
    );
  }
}
