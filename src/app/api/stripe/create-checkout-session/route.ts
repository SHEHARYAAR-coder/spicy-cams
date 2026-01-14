import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";

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

// Define pricing plans
const PRICING_PLANS = {
  basic: {
    name: "Basic Plan",
    amount: 500, // $5.00 in cents
    tokens: 10,
    description: "10 tokens per month",
  },
  plus: {
    name: "Plus Plan",
    amount: 1500, // $15.00 in cents
    tokens: 50,
    description: "50 tokens per month - Most Popular",
  },
  pro: {
    name: "Pro Plan",
    amount: 5000, // $50.00 in cents
    tokens: 200,
    description: "200 tokens per month",
  },
};

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, customAmount, customTokens } = await req.json();

    let plan;
    let amount;
    let tokens;
    let planName;
    let planDescription;

    if (planId === "custom" && customAmount && customTokens) {
      // Handle custom amounts
      amount = customAmount; // Already in cents
      tokens = customTokens;
      planName = "Custom Token Package";
      planDescription = `${tokens} tokens - Custom amount`;
      
      // Validate custom amount (minimum $2.50 for 5 tokens, maximum $500 for 1000 tokens)
      if (amount < 250 || amount > 50000 || tokens < 5 || tokens > 1000) {
        return NextResponse.json(
          { error: "Invalid custom amount. Min: $2.50 (5 tokens), Max: $500 (1000 tokens)" },
          { status: 400 }
        );
      }
    } else {
      // Handle preset plans
      if (!planId || !PRICING_PLANS[planId as keyof typeof PRICING_PLANS]) {
        return NextResponse.json(
          { error: "Invalid plan selected" },
          { status: 400 }
        );
      }

      plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
      amount = plan.amount;
      tokens = plan.tokens;
      planName = plan.name;
      planDescription = plan.description;
    }

    // Create Stripe checkout session
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planName,
              description: planDescription,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id!,
        planId: planId === "custom" ? "custom" : planId,
        tokens: tokens.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${session.user.id}/payments?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      customer_email: session.user.email!,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
