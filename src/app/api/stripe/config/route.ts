import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSessionUser } from "@/lib/session-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getSessionUser(session);

    // Check environment configuration
    const config = {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasStripePublicKey: !!process.env.STRIPE_PUBLIC_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV,
    };

    return NextResponse.json({
      message: "Stripe configuration status",
      userId: user?.id || "unknown",
      userEmail: user?.email || "unknown",
      config,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`,
      note: "For local development, use Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/webhook",
    });
  } catch (error: any) {
    console.error("Error checking Stripe config:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check configuration" },
      { status: 500 }
    );
  }
}
