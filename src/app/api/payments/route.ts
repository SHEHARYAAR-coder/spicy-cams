import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user's payments
    const payments = await prisma.payment.findMany({
      where: {
        userId: userId!,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        provider: true,
        providerRef: true,
        status: true,
        amount: true,
        currency: true,
        credits: true,
        completedAt: true,
        createdAt: true,
        failureReason: true,
      },
    });

    // Get user's current wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: userId! },
      select: {
        balance: true,
        currency: true,
      },
    });

    return NextResponse.json({
      payments,
      wallet,
    });
  } catch (error: unknown) {
    console.error("Error fetching payments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch payments";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
