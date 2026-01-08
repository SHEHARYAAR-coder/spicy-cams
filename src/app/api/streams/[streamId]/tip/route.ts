import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * POST /api/streams/[streamId]/tip
 * 
 * Process a tip from viewer to model
 * - Deducts tokens from viewer's wallet
 * - Credits model's wallet with earnings
 * - Creates ledger entries for both parties
 * - Sends chat message with tip notification
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
    const { tokens, activity } = body;

    if (!tokens || tokens <= 0) {
      return NextResponse.json(
        { error: "Invalid tip amount" },
        { status: 400 }
      );
    }

    // Get stream and model info
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        model: {
          include: {
            wallet: true,
            profile: true,
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Prevent model from tipping themselves
    if (stream.modelId === userId) {
      return NextResponse.json(
        { error: "You cannot tip yourself" },
        { status: 400 }
      );
    }

    // Get viewer's wallet
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

    // Convert tip amount to Decimal
    const tipAmount = new Prisma.Decimal(tokens);

    // Check if viewer has sufficient balance
    if (viewerWallet.balance.lt(tipAmount)) {
      return NextResponse.json(
        {
          error: "Insufficient balance",
          required: tipAmount.toString(),
          current: viewerWallet.balance.toString(),
          insufficientFunds: true,
        },
        { status: 402 } // Payment Required
      );
    }

    // Calculate model earnings (100% of tip goes to model)
    const modelEarnings = tipAmount;

    // Get viewer profile for chat message
    const viewerProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    // Process transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct tokens from viewer's wallet
      const updatedViewerWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: tipAmount,
          },
        },
      });

      // Update or create model's wallet
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
          amount: tipAmount.neg(), // Negative for debit
          currency: "USD",
          balanceAfter: updatedViewerWallet.balance,
          referenceType: "TIP",
          referenceId: streamId,
          description: activity
            ? `Tipped ${tipAmount} tokens for "${activity}" to ${stream.model.profile?.displayName || "model"}`
            : `Tipped ${tipAmount} tokens to ${stream.model.profile?.displayName || "model"}`,
          metadata: {
            streamId,
            streamTitle: stream.title,
            modelId: stream.modelId,
            tokensCharged: tipAmount.toString(),
            activity: activity || null,
          },
        },
      });

      // Create ledger entry for model (DEPOSIT)
      await tx.ledgerEntry.create({
        data: {
          userId: stream.modelId,
          type: "DEPOSIT",
          amount: modelEarnings,
          currency: "USD",
          balanceAfter: modelWallet.balance,
          referenceType: "TIP_RECEIVED",
          referenceId: streamId,
          description: activity
            ? `Received tip: ${modelEarnings} tokens for "${activity}" from ${viewerProfile?.displayName || "viewer"}`
            : `Received tip: ${modelEarnings} tokens from ${viewerProfile?.displayName || "viewer"}`,
          metadata: {
            streamId,
            streamTitle: stream.title,
            viewerId: userId,
            earningsAmount: modelEarnings.toString(),
            activity: activity || null,
          },
        },
      });

      // Create chat message for tip notification
      const tipMessage = activity
        ? `💝 Tipped ${tokens} tokens for "${activity}"!`
        : `💝 Tipped ${tokens} tokens!`;

      const chatMessage = await tx.chatMessage.create({
        data: {
          streamId,
          userId,
          message: tipMessage,
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });

      return {
        viewerWallet: updatedViewerWallet,
        modelWallet,
        chatMessage,
      };
    });

    return NextResponse.json({
      success: true,
      tip: {
        tokens: tipAmount.toString(),
        activity: activity || null,
        modelEarned: modelEarnings.toString(),
      },
      wallet: {
        remainingBalance: result.viewerWallet.balance.toString(),
      },
      message: {
        id: result.chatMessage.id,
        message: result.chatMessage.message,
        createdAt: result.chatMessage.createdAt.toISOString(),
        user: {
          id: result.chatMessage.user.id,
          displayName: result.chatMessage.user.profile?.displayName || "Anonymous",
          avatarUrl: result.chatMessage.user.profile?.avatarUrl,
          role: result.chatMessage.user.role,
        },
      },
    });
  } catch (error) {
    console.error("Tip processing error:", error);
    return NextResponse.json(
      { error: "Failed to process tip" },
      { status: 500 }
    );
  }
}
