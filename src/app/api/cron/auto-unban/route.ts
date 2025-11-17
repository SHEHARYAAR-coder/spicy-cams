import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron job endpoint to automatically unban/unsuspend users
 * This should be called periodically (e.g., every 5 minutes) by a service like Vercel Cron or a scheduled task
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-secure-cron-secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find all users with expired bans
    const expiredBans = await prisma.user.findMany({
      where: {
        status: "BANNED",
        banExpiresAt: {
          not: null,
          lte: now,
        },
      },
      select: {
        id: true,
        email: true,
        banExpiresAt: true,
      },
    });

    // Find all users with expired suspensions
    const expiredSuspensions = await prisma.user.findMany({
      where: {
        status: "SUSPENDED",
        suspendExpiresAt: {
          not: null,
          lte: now,
        },
      },
      select: {
        id: true,
        email: true,
        suspendExpiresAt: true,
      },
    });

    // Update expired bans
    if (expiredBans.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: {
            in: expiredBans.map((u) => u.id),
          },
        },
        data: {
          status: "ACTIVE",
          banExpiresAt: null,
          banReason: null,
        },
      });
    }

    // Update expired suspensions
    if (expiredSuspensions.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: {
            in: expiredSuspensions.map((u) => u.id),
          },
        },
        data: {
          status: "ACTIVE",
          suspendExpiresAt: null,
          suspendReason: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Expired restrictions updated",
      unbanned: expiredBans.length,
      unsuspended: expiredSuspensions.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in auto-unban cron job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
