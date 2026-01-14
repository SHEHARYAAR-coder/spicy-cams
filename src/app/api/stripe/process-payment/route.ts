import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-09-30.clover",
  });
};

const PRICING_PLANS = {
  basic: { tokens: 10, name: "Basic Plan" },
  plus: { tokens: 50, name: "Plus Plan" },
  pro: { tokens: 200, name: "Pro Plan" },
};

/**
 * POST /api/stripe/process-payment
 * 
 * Manually process a Stripe payment if webhook wasn't received
 * This is a fallback for development environments
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Check if payment already exists in database
    const existingPayment = await prisma.payment.findUnique({
      where: { providerRef: sessionId },
    });

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
        payment: existingPayment,
      });
    }

    // Retrieve session from Stripe
    const stripe = getStripe();
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify session belongs to current user
    if (stripeSession.metadata?.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Session does not belong to current user" },
        { status: 403 }
      );
    }

    // Check if payment was successful
    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment was not successful" },
        { status: 400 }
      );
    }

    // Extract metadata
    const userId = stripeSession.metadata?.userId!;
    const planId = stripeSession.metadata?.planId;
    const tokens = parseInt(stripeSession.metadata?.tokens || "0");

    if (!planId || !tokens) {
      return NextResponse.json(
        { error: "Invalid session metadata" },
        { status: 400 }
      );
    }

    console.log(`🔄 Manually processing payment for user ${userId}: session ${sessionId}`);

    // Process payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create or update wallet
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {
          balance: { increment: tokens },
          updatedAt: new Date(),
        },
        create: {
          userId,
          balance: tokens,
          currency: "USD",
        },
      });

      // Get updated balance
      const updatedWallet = await tx.wallet.findUnique({
        where: { userId },
        select: { balance: true },
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          userId,
          provider: "STRIPE",
          providerRef: sessionId,
          status: "SUCCEEDED",
          amount: (stripeSession.amount_total || 0) / 100,
          currency: stripeSession.currency?.toUpperCase() || "USD",
          credits: tokens,
          webhookData: JSON.parse(JSON.stringify(stripeSession)),
          completedAt: new Date(),
        },
      });

      // Create ledger entry
      await tx.ledgerEntry.create({
        data: {
          userId,
          type: "DEPOSIT",
          amount: tokens,
          currency: "USD",
          balanceAfter: updatedWallet?.balance || wallet.balance,
          referenceType: "PAYMENT",
          referenceId: sessionId,
          description: `Purchased ${planId} plan - ${tokens} tokens (Manual processing)`,
          metadata: {
            planId,
            stripeSessionId: sessionId,
            manualProcessing: true,
          },
        },
      });

      return {
        payment,
        wallet: updatedWallet,
        tokens,
      };
    });

    console.log(
      `✅ Successfully processed payment manually for user ${userId}: +${tokens} tokens (New balance: ${result.wallet?.balance})`
    );

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      payment: result.payment,
      wallet: {
        balance: Number(result.wallet?.balance || 0),
        tokensAdded: tokens,
      },
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process payment";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}