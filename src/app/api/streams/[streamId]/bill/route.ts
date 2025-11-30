import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * POST /api/streams/[streamId]/bill
 * 
 * Bills a viewer for watching a stream.
 * Deducts credits from viewer's wallet and credits them to the creator.
 * 
 * Pricing:
 * - $0.22 per minute per viewer (based on pricing page)
 * - This translates to approximately $0.0037 per second
 * - We'll charge per 30-second interval to avoid micro-transactions
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { streamId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { streamId } = params;

    // Parse request body
    const body = await req.json();
    const { watchTimeSeconds = 60 } = body; // Default to 60 seconds (1 minute)

    // Validate watch time
    if (watchTimeSeconds <= 0 || watchTimeSeconds > 300) { // Max 5 minutes per billing cycle
      return NextResponse.json(
        { error: "Invalid watch time. Must be between 1 and 300 seconds." },
        { status: 400 }
      );
    }

    // Find the stream
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        creator: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Check if stream is live
    if (stream.status !== "LIVE") {
      return NextResponse.json(
        { error: "Stream is not live" },
        { status: 400 }
      );
    }

    // Prevent creator from being billed for their own stream
    if (stream.creatorId === userId) {
      return NextResponse.json(
        { 
          success: true, 
          charged: false, 
          message: "Creator not charged for own stream" 
        },
        { status: 200 }
      );
    }

    // Get or create viewer's wallet
    let viewerWallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!viewerWallet) {
      viewerWallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          currency: "USD",
        },
      });
    }

    // Calculate charge amount
    // $0.22 per minute = $0.0036667 per second
    const ratePerSecond = 0.22 / 60; // $0.0036667
    const chargeAmount = new Prisma.Decimal(
      (ratePerSecond * watchTimeSeconds).toFixed(4)
    );

    // Check if viewer has sufficient balance
    if (viewerWallet.balance.lt(chargeAmount)) {
      return NextResponse.json(
        {
          error: "Insufficient balance",
          required: chargeAmount.toString(),
          current: viewerWallet.balance.toString(),
          insufficientFunds: true,
        },
        { status: 402 } // Payment Required
      );
    }

    // Get or create active stream session
    let streamSession = await prisma.streamSession.findFirst({
      where: {
        streamId,
        userId,
        status: "active",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!streamSession) {
      // Create new stream session
      streamSession = await prisma.streamSession.create({
        data: {
          streamId,
          userId,
          status: "active",
          totalWatchMs: 0,
          sessionToken: `session_${Date.now()}_${Math.random().toString(36)}`,
        },
      });
    }

    // Calculate interval index (how many billing cycles have passed)
    const intervalIndex = Math.floor(streamSession.totalWatchMs / (watchTimeSeconds * 1000));

    // Perform transaction: deduct from viewer, credit to creator, create ledger entries
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from viewer's wallet
      const updatedViewerWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: chargeAmount,
          },
        },
      });

      // Credit to creator's wallet (get or create)
      let creatorWallet = await tx.wallet.findUnique({
        where: { userId: stream.creatorId },
      });

      if (!creatorWallet) {
        creatorWallet = await tx.wallet.create({
          data: {
            userId: stream.creatorId,
            balance: chargeAmount,
            currency: "USD",
          },
        });
      } else {
        creatorWallet = await tx.wallet.update({
          where: { userId: stream.creatorId },
          data: {
            balance: {
              increment: chargeAmount,
            },
          },
        });
      }

      // Create ledger entry for viewer (DEBIT)
      await tx.ledgerEntry.create({
        data: {
          userId,
          type: "DEBIT",
          amount: chargeAmount.neg(), // Negative for debit
          currency: "USD",
          balanceAfter: updatedViewerWallet.balance,
          referenceType: "STREAM_VIEW",
          referenceId: streamId,
          description: `Watched stream: ${stream.title}`,
          metadata: {
            streamId,
            streamTitle: stream.title,
            creatorId: stream.creatorId,
            watchTimeSeconds,
            sessionId: streamSession.id,
          },
        },
      });

      // Create ledger entry for creator (DEPOSIT)
      await tx.ledgerEntry.create({
        data: {
          userId: stream.creatorId,
          type: "DEPOSIT",
          amount: chargeAmount,
          currency: "USD",
          balanceAfter: creatorWallet.balance,
          referenceType: "STREAM_EARNINGS",
          referenceId: streamId,
          description: `Earnings from stream: ${stream.title}`,
          metadata: {
            streamId,
            streamTitle: stream.title,
            viewerId: userId,
            watchTimeSeconds,
            sessionId: streamSession.id,
          },
        },
      });

      // Update stream session watch time
      const updatedSession = await tx.streamSession.update({
        where: { id: streamSession!.id },
        data: {
          totalWatchMs: {
            increment: watchTimeSeconds * 1000,
          },
          lastHeartbeat: new Date(),
        },
      });

      // Create meter event for tracking
      await tx.meterEvent.create({
        data: {
          sessionId: streamSession!.id,
          userId,
          intervalIndex,
          playbackMs: watchTimeSeconds * 1000,
          creditsDebited: chargeAmount,
        },
      });

      return {
        viewerWallet: updatedViewerWallet,
        creatorWallet,
        streamSession: updatedSession,
      };
    });

    return NextResponse.json({
      success: true,
      charged: true,
      amount: chargeAmount.toString(),
      remainingBalance: result.viewerWallet.balance.toString(),
      watchTimeSeconds,
      totalWatchTimeMs: result.streamSession.totalWatchMs,
    });
  } catch (error) {
    console.error("Billing error:", error);
    return NextResponse.json(
      { error: "Failed to process billing" },
      { status: 500 }
    );
  }
}
