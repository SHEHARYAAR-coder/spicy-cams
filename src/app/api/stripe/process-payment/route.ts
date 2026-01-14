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
    const userId = stripeSession.metadata?.userId ?? '';
    const planId = stripeSession.metadata?.planId;
    const tokens = parseInt(stripeSession.metadata?.tokens || "0");

    if (!planId || !tokens) {
      return NextResponse.json(
        { error: "Invalid session metadata" },
        { status: 400 }
      );
    }

    console.log(`🔄 Manually processing payment for user ${userId}: session ${sessionId}`);

    try {
      // Process payment in transaction with proper error handling
      const result = await prisma.$transaction(async (tx) => {
        // First, try to find existing payment
        let payment = await tx.payment.findUnique({
          where: { providerRef: sessionId },
        });

        const isNewPayment = !payment;
        let wallet;
        let updatedWallet;
        
        if (isNewPayment) {
          // Create new payment record
          payment = await tx.payment.create({
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

          // Update wallet balance
          wallet = await tx.wallet.upsert({
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

          updatedWallet = await tx.wallet.findUnique({
            where: { userId },
            select: { balance: true },
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
        } else {
          // Payment already exists, just get current wallet balance
          updatedWallet = await tx.wallet.findUnique({
            where: { userId },
            select: { balance: true },
          });
        }

        return {
          payment,
          wallet: updatedWallet,
          tokens: isNewPayment ? tokens : 0,
          alreadyProcessed: !isNewPayment,
        };
      }, {
        maxWait: 5000, // Maximum wait time for a transaction to start
        timeout: 10000, // Maximum time for the transaction to complete
      });

      const message = result.alreadyProcessed 
        ? `⚠️ Payment already processed for user ${userId}: session ${sessionId} (Balance: ${result.wallet?.balance})`
        : `✅ Successfully processed payment manually for user ${userId}: +${result.tokens} tokens (New balance: ${result.wallet?.balance})`;
      
      console.log(message);

      return NextResponse.json({
        success: true,
        message: result.alreadyProcessed ? "Payment already processed" : "Payment processed successfully",
        payment: result.payment,
        wallet: {
          balance: Number(result.wallet?.balance || 0),
          tokensAdded: result.tokens,
        },
      });
    } catch (txError: unknown) {
      // Handle unique constraint violation (race condition)
      const prismaError = txError as { code?: string; meta?: { target?: string[] } };
      if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('provider_ref')) {
        console.log(`⚠️ Race condition detected - payment already exists for session ${sessionId}, fetching existing payment...`);
        
        // Payment was created by another request, fetch it
        const existingPayment = await prisma.payment.findUnique({
          where: { providerRef: sessionId },
        });

        const wallet = await prisma.wallet.findUnique({
          where: { userId },
          select: { balance: true },
        });

        console.log(`✅ Returning existing payment for user ${userId}: session ${sessionId} (Balance: ${wallet?.balance})`);

        return NextResponse.json({
          success: true,
          message: "Payment already processed",
          payment: existingPayment,
          wallet: {
            balance: Number(wallet?.balance || 0),
            tokensAdded: 0, // Already added by the other request
          },
        });
      }
      
      // Re-throw if it's a different error
      throw txError;
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process payment";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}