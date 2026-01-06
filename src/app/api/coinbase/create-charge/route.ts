import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Define pricing plans (same as Stripe)
const PRICING_PLANS = {
  basic: {
    name: "Basic Plan",
    amount: "5.00", // USD amount
    tokens: 10,
    description: "10 tokens per month",
  },
  plus: {
    name: "Plus Plan",
    amount: "15.00",
    tokens: 50,
    description: "50 tokens per month - Most Popular",
  },
  pro: {
    name: "Pro Plan",
    amount: "50.00",
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

    const { planId } = await req.json();

    // Validate plan
    if (!planId || !PRICING_PLANS[planId as keyof typeof PRICING_PLANS]) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];

    // Check if Coinbase Commerce API key is configured
    if (!process.env.COINBASE_COMMERCE_API_KEY) {
      return NextResponse.json(
        { error: "Coinbase Commerce is not configured" },
        { status: 500 }
      );
    }

    // Create Coinbase Commerce charge
    const response = await fetch("https://api.commerce.coinbase.com/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": process.env.COINBASE_COMMERCE_API_KEY,
        "X-CC-Version": "2018-03-22",
      },
      body: JSON.stringify({
        name: plan.name,
        description: plan.description,
        pricing_type: "fixed_price",
        local_price: {
          amount: plan.amount,
          currency: "USD",
        },
        metadata: {
          userId: session.user.id!,
          planId,
          tokens: plan.tokens.toString(),
          userEmail: session.user.email!,
        },
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${session.user.id}/payments?crypto=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Coinbase Commerce error:", errorData);
      throw new Error(
        errorData.error?.message || "Failed to create crypto charge"
      );
    }

    const data = await response.json();
    const charge = data.data;

    return NextResponse.json({
      chargeId: charge.id,
      chargeCode: charge.code,
      hostedUrl: charge.hosted_url,
      expiresAt: charge.expires_at,
    });
  } catch (error: unknown) {
    console.error("Error creating Coinbase charge:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create crypto charge";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
