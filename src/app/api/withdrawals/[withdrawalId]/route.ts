import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Lazy initialization to avoid build-time errors
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-09-30.clover",
  });
};

/**
 * GET /api/withdrawals/[withdrawalId]
 * 
 * Get a specific withdrawal request
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ withdrawalId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;
    const { withdrawalId } = await params;

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (userRole !== "ADMIN" && withdrawal.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({ withdrawal });
  } catch (error) {
    console.error("Error fetching withdrawal:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawal" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/withdrawals/[withdrawalId]
 * 
 * Update withdrawal request (admin approval/rejection)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ withdrawalId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;

    // Only admins can approve/reject withdrawals
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can approve/reject withdrawals" },
        { status: 403 }
      );
    }

    const { withdrawalId } = await params;
    const body = await req.json();
    const { action, note } = body; // action: "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get withdrawal request
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          include: {
            wallet: true,
            profile: true,
          },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    // Check if already processed
    if (withdrawal.status !== "PENDING") {
      return NextResponse.json(
        { error: `Withdrawal is already ${withdrawal.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (action === "reject") {
      // Simply update status to rejected
      const updatedWithdrawal = await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNote: note || "Withdrawal request rejected by admin",
        },
      });

      return NextResponse.json({
        success: true,
        withdrawal: updatedWithdrawal,
        message: "Withdrawal request rejected",
      });
    }

    // APPROVE - Process payout via Stripe
    if (!withdrawal.user.wallet) {
      return NextResponse.json(
        { error: "User wallet not found" },
        { status: 404 }
      );
    }

    // Check if user still has sufficient balance
    if (withdrawal.user.wallet.balance.lt(withdrawal.amount)) {
      return NextResponse.json(
        { error: "User has insufficient balance for withdrawal" },
        { status: 400 }
      );
    }

    try {
      // Process payout via Stripe
      // Note: For production, you'll need to set up Stripe Connect for models
      // For now, we'll mark as approved and store the payout ID
      
      getStripe(); // Initialize stripe to check configuration
      
      // In a real implementation, you would:
      // model (if not exists)
      // 2. Create a payout to their connected account
      // For this example, we'll simulate a payout and create a transfer
      
      // Simulated payout (in production, replace with actual Stripe payout)
      const payoutId = `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Process withdrawal in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct from user's wallet
        const updatedWallet = await tx.wallet.update({
          where: { userId: withdrawal.userId },
          data: {
            balance: {
              decrement: withdrawal.amount,
            },
          },
        });

        // Create ledger entry for withdrawal
        await tx.ledgerEntry.create({
          data: {
            userId: withdrawal.userId,
            type: "DEBIT",
            amount: withdrawal.amount.neg(),
            currency: "USD",
            balanceAfter: updatedWallet.balance,
            referenceType: "WITHDRAWAL",
            referenceId: withdrawalId,
            description: `Withdrawal request approved - $${withdrawal.amount}`,
            metadata: {
              withdrawalId,
              payoutId,
              approvedBy: userId,
            },
          },
        });

        // Update withdrawal request
        const updatedWithdrawal = await tx.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: "APPROVED",
            reviewedBy: userId,
            reviewedAt: new Date(),
            reviewNote: note || "Withdrawal approved and processed",
            stripePayoutId: payoutId,
          },
        });

        return { withdrawal: updatedWithdrawal, wallet: updatedWallet };
      });

      // TODO: In production, integrate actual Stripe payout here
      // const payout = await stripe.payouts.create({
      //   amount: Math.round(Number(withdrawal.amount) * 100), // Convert to cents
      //   currency: 'usd',
      //   destination: withdrawal.user.stripeAccountId, // Require models to connect Stripe
      //   metadata: {
      //     withdrawalId: withdrawal.id,
      //     userId: withdrawal.userId,
      //   },
      // });

      return NextResponse.json({
        success: true,
        withdrawal: result.withdrawal,
        message: "Withdrawal approved and processed successfully",
        payoutId,
      });
    } catch (stripeError) {
      console.error("Stripe payout error:", stripeError);
      
      // Mark withdrawal as failed
      await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "FAILED",
          reviewedBy: userId,
          reviewedAt: new Date(),
          failureReason: stripeError instanceof Error ? stripeError.message : "Payout failed",
        },
      });

      return NextResponse.json(
        { error: "Failed to process payout. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating withdrawal:", error);
    return NextResponse.json(
      { error: "Failed to update withdrawal" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/withdrawals/[withdrawalId]
 * 
 * Cancel a pending withdrawal request (creator only)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ withdrawalId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { withdrawalId } = await params;

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (withdrawal.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Can only cancel pending requests
    if (withdrawal.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only cancel pending withdrawal requests" },
        { status: 400 }
      );
    }

    // Delete the withdrawal request
    await prisma.withdrawalRequest.delete({
      where: { id: withdrawalId },
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal request cancelled",
    });
  } catch (error) {
    console.error("Error deleting withdrawal:", error);
    return NextResponse.json(
      { error: "Failed to cancel withdrawal" },
      { status: 500 }
    );
  }
}
