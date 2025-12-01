import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true, currency: true },
    });

    if (!wallet) {
      // If wallet doesn't exist, return 0 balance (or create one, but 0 is safe for display)
      return NextResponse.json({ balance: 0, currency: "USD" });
    }

    return NextResponse.json({
      balance: Number(wallet.balance),
      currency: wallet.currency,
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
