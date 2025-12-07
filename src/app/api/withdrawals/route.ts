import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * GET /api/withdrawals
 * 
 * Fetch withdrawal requests for the authenticated user
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;

    // Admins can see all withdrawal requests
    const whereClause = userRole === "ADMIN" 
      ? {} 
      : { userId };

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/withdrawals
 * 
 * Create a new withdrawal request
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;

    // Only models can request withdrawals
    if (userRole !== "MODEL" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only models can request withdrawals" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { amount } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount" },
        { status: 400 }
      );
    }

    // Minimum withdrawal amount: $50
    const MIN_WITHDRAWAL = 50;
    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}` },
        { status: 400 }
      );
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Check if user has sufficient balance
    const requestedAmount = new Prisma.Decimal(amount);
    if (wallet.balance.lt(requestedAmount)) {
      return NextResponse.json(
        {
          error: "Insufficient balance",
          available: wallet.balance.toString(),
          requested: amount,
        },
        { status: 400 }
      );
    }

    // Check for pending withdrawal requests
    const pendingWithdrawal = await prisma.withdrawalRequest.findFirst({
      where: {
        userId,
        status: "PENDING",
      },
    });

    if (pendingWithdrawal) {
      return NextResponse.json(
        { error: "You already have a pending withdrawal request" },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount: requestedAmount,
        currency: "USD",
        status: "PENDING",
      },
      include: {
        user: {
          select: {
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

    return NextResponse.json({
      success: true,
      withdrawal,
      message: "Withdrawal request submitted successfully. An admin will review your request.",
    });
  } catch (error) {
    console.error("Error creating withdrawal request:", error);
    return NextResponse.json(
      { error: "Failed to create withdrawal request" },
      { status: 500 }
    );
  }
}
