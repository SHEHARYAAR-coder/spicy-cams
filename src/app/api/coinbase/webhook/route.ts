import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Verify Coinbase Commerce webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(req: NextRequest) {
  console.log("🔔 Coinbase Commerce webhook endpoint hit");

  const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("❌ COINBASE_COMMERCE_WEBHOOK_SECRET is not configured!");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("x-cc-webhook-signature");

  if (!signature) {
    console.error("❌ No x-cc-webhook-signature header found");
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  // Verify webhook signature
  if (!verifySignature(body, signature, webhookSecret)) {
    console.error("❌ Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("✅ Webhook signature verified");

  let event;
  try {
    event = JSON.parse(body);
  } catch (error) {
    console.error("❌ Failed to parse webhook body:", error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle the event
  try {
    const eventType = event.event.type;
    const charge = event.event.data;

    console.log("📦 Event type:", eventType);
    console.log("💰 Charge ID:", charge.id);
    console.log("📋 Metadata:", charge.metadata);

    switch (eventType) {
      case "charge:confirmed":
      case "charge:resolved": {
        // Payment confirmed - credit user's wallet
        const userId = charge.metadata?.userId;
        const planId = charge.metadata?.planId;
        const tokens = parseInt(charge.metadata?.tokens || "0");

        console.log(
          "Parsed values - userId:",
          userId,
          "planId:",
          planId,
          "tokens:",
          tokens
        );

        if (!userId || !tokens) {
          console.error("Missing userId or tokens in charge metadata");
          return NextResponse.json(
            { error: "Invalid metadata" },
            { status: 400 }
          );
        }

        // Check if payment already exists to prevent duplicates
        const existingPayment = await prisma.payment.findUnique({
          where: { providerRef: charge.code },
        });

        if (existingPayment) {
          console.log("⚠️ Payment already processed, skipping:", charge.code);
          return NextResponse.json({
            received: true,
            message: "Already processed",
          });
        }

        console.log("💰 Processing crypto payment for user:", userId);

        // Get current balance before update
        const currentWallet = await prisma.wallet.findUnique({
          where: { userId },
          select: { balance: true },
        });

        console.log("Current balance:", currentWallet?.balance || 0);

        // Create or update wallet
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

        // Get pricing info from charge
        const pricingInfo = charge.pricing?.local || charge.pricing?.settlement;
        const amount = parseFloat(pricingInfo?.amount || "0");
        const currency = pricingInfo?.currency || "USD";

        // Create payment record
        await prisma.payment.create({
          data: {
            userId,
            provider: "COINBASE",
            providerRef: charge.code,
            status: "SUCCEEDED",
            amount,
            currency,
            credits: tokens,
            webhookData: charge,
            completedAt: new Date(),
          },
        });

        // Create ledger entry
        await prisma.ledgerEntry.create({
          data: {
            userId,
            type: "DEPOSIT",
            amount: tokens,
            currency: "USD",
            balanceAfter: updatedWallet?.balance || wallet.balance,
            referenceType: "PAYMENT",
            referenceId: charge.code,
            description: `Crypto payment: ${planId} plan - ${tokens} tokens`,
            metadata: {
              planId,
              coinbaseChargeCode: charge.code,
              coinbaseChargeId: charge.id,
              paymentMethod: "cryptocurrency",
            },
          },
        });

        console.log(
          `✅ Successfully processed crypto payment for user ${userId}: +${tokens} tokens (New balance: ${updatedWallet?.balance})`
        );
        break;
      }

      case "charge:failed": {
        // Payment failed
        const userId = charge.metadata?.userId;
        const tokens = parseInt(charge.metadata?.tokens || "0");

        if (userId) {
          const pricingInfo = charge.pricing?.local || charge.pricing?.settlement;
          const amount = parseFloat(pricingInfo?.amount || "0");
          const currency = pricingInfo?.currency || "USD";

          await prisma.payment.create({
            data: {
              userId,
              provider: "COINBASE",
              providerRef: charge.code,
              status: "FAILED",
              amount,
              currency,
              credits: tokens,
              webhookData: charge,
              failureReason: "Crypto payment failed or expired",
            },
          });
        }

        console.log("❌ Crypto payment failed:", charge.code);
        break;
      }

      case "charge:pending": {
        // Payment pending - optional: create pending payment record
        console.log("⏳ Crypto payment pending:", charge.code);
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("❌ Error processing webhook:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
