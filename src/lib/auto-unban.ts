import { prisma } from "./prisma";
import { UserStatus } from "@prisma/client";

/**
 * Check and automatically unban/unsuspend users whose ban/suspension period has expired
 * This function should be called during login and periodically via a cron job
 */
export async function checkAndUpdateExpiredRestrictions(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        banExpiresAt: true,
        suspendExpiresAt: true,
        banReason: true,
        suspendReason: true,
      },
    });

    if (!user) return null;

    const now = new Date();
    let shouldUpdate = false;
    const updateData: {
      status?: UserStatus;
      banExpiresAt?: Date | null;
      banReason?: string | null;
      suspendExpiresAt?: Date | null;
      suspendReason?: string | null;
    } = {};

    // Check if ban has expired
    if (
      user.status === "BANNED" &&
      user.banExpiresAt &&
      user.banExpiresAt <= now
    ) {
      updateData.status = "ACTIVE";
      updateData.banExpiresAt = null;
      updateData.banReason = null;
      shouldUpdate = true;
    }

    // Check if suspension has expired
    if (
      user.status === "SUSPENDED" &&
      user.suspendExpiresAt &&
      user.suspendExpiresAt <= now
    ) {
      updateData.status = "ACTIVE";
      updateData.suspendExpiresAt = null;
      updateData.suspendReason = null;
      shouldUpdate = true;
    }

    // Update user if restrictions have expired
    if (shouldUpdate) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      return updatedUser;
    }

    return user;
  } catch (error) {
    console.error("Error checking expired restrictions:", error);
    return null;
  }
}

/**
 * Get user's restriction status with remaining time
 */
export function getRestrictionInfo(user: {
  status: string;
  banExpiresAt: Date | null;
  suspendExpiresAt: Date | null;
  banReason?: string | null;
  suspendReason?: string | null;
}) {
  const now = new Date();

  if (user.status === "BANNED") {
    if (user.banExpiresAt) {
      const timeRemaining = user.banExpiresAt.getTime() - now.getTime();
      if (timeRemaining > 0) {
        return {
          restricted: true,
          type: "BANNED",
          expiresAt: user.banExpiresAt,
          reason: user.banReason || "No reason provided",
          timeRemaining: formatTimeRemaining(timeRemaining),
          isPermanent: false,
        };
      }
    } else {
      // Permanent ban
      return {
        restricted: true,
        type: "BANNED",
        expiresAt: null,
        reason: user.banReason || "No reason provided",
        timeRemaining: "Permanent",
        isPermanent: true,
      };
    }
  }

  if (user.status === "SUSPENDED") {
    if (user.suspendExpiresAt) {
      const timeRemaining = user.suspendExpiresAt.getTime() - now.getTime();
      if (timeRemaining > 0) {
        return {
          restricted: true,
          type: "SUSPENDED",
          expiresAt: user.suspendExpiresAt,
          reason: user.suspendReason || "No reason provided",
          timeRemaining: formatTimeRemaining(timeRemaining),
          isPermanent: false,
        };
      }
    }
  }

  return {
    restricted: false,
    type: null,
    expiresAt: null,
    reason: null,
    timeRemaining: null,
    isPermanent: false,
  };
}

/**
 * Format time remaining in a human-readable format
 */
function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""}`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? "s" : ""}`;
  } else if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds > 1 ? "s" : ""}`;
  }
}
