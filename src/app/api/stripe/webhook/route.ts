import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Lazy initialization to avoid build-time errors
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Use a valid, typed API version supported by the installed stripe SDK
    apiVersion: "2025-09-30.clover",
  });
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  console.log("🎯 Webhook endpoint hit");

  // Check if webhook secret is configured
  if (!webhookSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET is not configured!");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("❌ No stripe-signature header found");
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("✅ Webhook signature verified");
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Webhook signature verification failed:", errMessage);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("🔔 Webhook received: checkout.session.completed");
        console.log("Session ID:", session.id);
        console.log("Session metadata:", session.metadata);

        // Extract metadata
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        const tokens = parseInt(session.metadata?.tokens || "0");

        console.log(
          "Parsed values - userId:",
          userId,
          "planId:",
          planId,
          "tokens:",
          tokens
        );

        if (!userId || !tokens) {
          console.error("Missing userId or tokens in session metadata");
          return NextResponse.json(
            { error: "Invalid metadata" },
            { status: 400 }
          );
        }

        // Check if payment already exists to prevent duplicates
        const existingPayment = await prisma.payment.findUnique({
          where: { providerRef: session.id },
        });

        if (existingPayment) {
          console.log("⚠️ Payment already processed, skipping:", session.id);
          return NextResponse.json({
            received: true,
            message: "Already processed",
          });
        }

        console.log("💰 Processing payment for user:", userId);

        // Get current balance before update
        const currentWallet = await prisma.wallet.findUnique({
          where: { userId },
          select: { balance: true },
        });

        console.log("Current balance:", currentWallet?.balance || 0);

        // Create or update wallet and get updated balance
        const wallet = await prisma.wallet.upsert({
          where: { userId },
          update: {
            balance: {
              increment: tokens,
            },
            updatedAt: new Date(),
          },
          create: {
            userId,
            balance: tokens,
            currency: "USD",
          },
        });

        // Fetch the updated wallet to get the correct balance after increment
        const updatedWallet = await prisma.wallet.findUnique({
          where: { userId },
          select: { balance: true },
        });

        console.log("New balance after increment:", updatedWallet?.balance);

        // Create payment record
        await prisma.payment.create({
          data: {
            userId,
            provider: "STRIPE",
            providerRef: session.id,
            status: "SUCCEEDED",
            amount: (session.amount_total || 0) / 100, // Convert cents to dollars
            currency: session.currency?.toUpperCase() || "USD",
            credits: tokens,
            webhookData: JSON.parse(JSON.stringify(session)),
            completedAt: new Date(),
          },
        });

        // Create ledger entry with correct balance after increment
        await prisma.ledgerEntry.create({
          data: {
            userId,
            type: "DEPOSIT",
            amount: tokens,
            currency: "USD",
            balanceAfter: updatedWallet?.balance || wallet.balance,
            referenceType: "PAYMENT",
            referenceId: session.id,
            description: `Purchased ${planId} plan - ${tokens} tokens`,
            metadata: {
              planId,
              stripeSessionId: session.id,
            },
          },
        });

        console.log(
          `✅ Successfully processed payment for user ${userId}: +${tokens} tokens (New balance: ${updatedWallet?.balance})`
        );
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Handle async payment success (similar to above)
        console.log("Async payment succeeded:", session.id);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        if (userId) {
          await prisma.payment.create({
            data: {
              userId,
              provider: "STRIPE",
              providerRef: session.id,
              status: "FAILED",
              amount: (session.amount_total || 0) / 100,
              currency: session.currency?.toUpperCase() || "USD",
              credits: 0,
              webhookData: JSON.parse(JSON.stringify(session)),
              failureReason: "Async payment failed",
            },
          });
        }

        console.log("Async payment failed:", session.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("Error processing webhook:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
