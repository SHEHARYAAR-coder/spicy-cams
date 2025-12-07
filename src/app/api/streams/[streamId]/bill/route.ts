import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * POST /api/streams/[streamId]/bill
 *
 * Bills a viewer for watching a stream.
 * Deducts credits from viewer's wallet and credits them to the model.
 *
 * Pricing:
 * - $0.22 per minute per viewer (based on pricing page)
 * - This translates to approximately $0.0037 per second
 * - We'll charge per 30-second interval to avoid micro-transactions
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { streamId } = await params;

    // Parse request body
    const body = await req.json();
    const { watchTimeSeconds = 60 } = body; // Default to 60 seconds (1 minute)

    // Validate watch time
    if (watchTimeSeconds <= 0 || watchTimeSeconds > 300) {
      // Max 5 minutes per billing cycle
      return NextResponse.json(
        { error: "Invalid watch time. Must be between 1 and 300 seconds." },
        { status: 400 }
      );
    }

    // Find the stream
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        model: {
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

    // model from being billed for their own stream
    if (stream.modelId === userId) {
      return NextResponse.json(
        {
          success: true,
          charged: false,
          message: "Model not charged for own stream",
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
    // Viewer: 5 tokens per minute
    // Model: $13.20 per minute
    const TOKENS_PER_MINUTE = 5;
    const MODEL_EARNINGS_PER_MINUTE = 13.20;
    
    const minutes = watchTimeSeconds / 60;
    const viewerTokenCharge = new Prisma.Decimal((TOKENS_PER_MINUTE * minutes).toFixed(4));
    const modelEarnings = new Prisma.Decimal((MODEL_EARNINGS_PER_MINUTE * minutes).toFixed(4));

    // Check if viewer has sufficient balance
    if (viewerWallet.balance.lt(viewerTokenCharge)) {
      return NextResponse.json(
        {
          error: "Insufficient balance",
          required: viewerTokenCharge.toString(),
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
    const intervalIndex = Math.floor(
      streamSession.totalWatchMs / (watchTimeSeconds * 1000)
    );

    // model, create ledger entries
    const result = await prisma.$transaction(async (tx) => {
      // Deduct tokens from viewer's wallet
      const updatedViewerWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: viewerTokenCharge,
          },
        },
      });

      // model's wallet (get or create)
      let modelWallet = await tx.wallet.findUnique({
        where: { userId: stream.modelId },
      });

      if (!modelWallet) {
        modelWallet = await tx.wallet.create({
          data: {
            userId: stream.modelId,
            balance: modelEarnings,
            currency: "USD",
          },
        });
      } else {
        modelWallet = await tx.wallet.update({
          where: { userId: stream.modelId },
          data: {
            balance: {
              increment: modelEarnings,
            },
          },
        });
      }

      // Create ledger entry for viewer (DEBIT)
      await tx.ledgerEntry.create({
        data: {
          userId,
          type: "DEBIT",
          amount: viewerTokenCharge.neg(), // Negative for debit
          currency: "USD",
          balanceAfter: updatedViewerWallet.balance,
          referenceType: "STREAM_VIEW",
          referenceId: streamId,
          description: `Watched stream: ${stream.title} (${viewerTokenCharge} tokens)`,
          metadata: {
            streamId,
            streamTitle: stream.title,
            modelId: stream.modelId,
            watchTimeSeconds,
            sessionId: streamSession.id,
            tokensCharged: viewerTokenCharge.toString(),
          },
        },
      });

      // model (DEPOSIT)
      await tx.ledgerEntry.create({
        data: {
          userId: stream.modelId,
          type: "DEPOSIT",
          amount: modelEarnings,
          currency: "USD",
          balanceAfter: modelWallet.balance,
          referenceType: "STREAM_EARNINGS",
          referenceId: streamId,
          description: `Earnings from stream: ${stream.title} ($${modelEarnings})`,
          metadata: {
            streamId,
            streamTitle: stream.title,
            viewerId: userId,
            watchTimeSeconds,
            sessionId: streamSession.id,
            earningsAmount: modelEarnings.toString(),
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
          creditsDebited: viewerTokenCharge,
        },
      });

      return {
        viewerWallet: updatedViewerWallet,
        modelWallet,
        streamSession: updatedSession,
      };
    });

    return NextResponse.json({
      success: true,
      charged: true,
      tokensCharged: viewerTokenCharge.toString(),
      modelEarned: modelEarnings.toString(),
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
