import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/earnings
 * 
 * Returns detailed earnings information for creators
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;

    // Only creators can view earnings
    if (userRole !== "CREATOR" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only creators can view earnings" },
        { status: 403 }
      );
    }

    // Get total earnings from ledger entries (DEPOSIT type for stream earnings)
    const earningsEntries = await prisma.ledgerEntry.findMany({
      where: {
        userId,
        type: "DEPOSIT",
        referenceType: "STREAM_EARNINGS",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Latest 100 earnings
    });

    const totalEarnings = earningsEntries.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0
    );

    // Get earnings by stream
    const earningsByStream = await prisma.ledgerEntry.groupBy({
      by: ["referenceId"],
      where: {
        userId,
        type: "DEPOSIT",
        referenceType: "STREAM_EARNINGS",
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get stream details for each earning
    const streamIds = earningsByStream
      .map((e) => e.referenceId)
      .filter((id): id is string => id !== null);

    const streams = await prisma.stream.findMany({
      where: {
        id: {
          in: streamIds,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    const streamMap = new Map(streams.map((s) => [s.id, s]));

    const earningsBreakdown = earningsByStream.map((earning) => {
      const stream = streamMap.get(earning.referenceId || "");
      return {
        streamId: earning.referenceId,
        streamTitle: stream?.title || "Unknown Stream",
        totalEarnings: Number(earning._sum.amount || 0),
        transactionCount: earning._count.id,
        streamStatus: stream?.status || "UNKNOWN",
        streamDate: stream?.createdAt,
      };
    });

    // Get earnings from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEarnings = await prisma.ledgerEntry.findMany({
      where: {
        userId,
        type: "DEPOSIT",
        referenceType: "STREAM_EARNINGS",
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    const last7DaysEarnings = recentEarnings.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0
    );

    // Get earnings from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyEarnings = await prisma.ledgerEntry.findMany({
      where: {
        userId,
        type: "DEPOSIT",
        referenceType: "STREAM_EARNINGS",
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const last30DaysEarnings = monthlyEarnings.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0
    );

    // Get current wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      totalEarnings,
      currentBalance: Number(wallet?.balance || 0),
      last7DaysEarnings,
      last30DaysEarnings,
      earningsBreakdown,
      recentTransactions: earningsEntries.slice(0, 10).map((entry) => ({
        id: entry.id,
        amount: Number(entry.amount),
        description: entry.description,
        createdAt: entry.createdAt,
        metadata: entry.metadata,
      })),
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
