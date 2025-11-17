import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UserRole, UserStatus, Prisma } from "@prisma/client";
import { getSessionUser } from "@/lib/session-helpers";

// Helper to check if user is moderator or admin
function isAuthorized(role: string): boolean {
  return role === "MODERATOR" || role === "ADMIN";
}

// GET: List all users with pagination and filters
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is moderator or admin
    if (!isAuthorized(sessionUser.role || "")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      // Exclude current user from the list
      id: { not: sessionUser.id },
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { profile: { displayName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (role && role !== "ALL") {
      where.role = role as UserRole;
    }

    if (status && status !== "ALL") {
      where.status = status as UserStatus;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            isCreator: true,
          },
        },
        wallet: {
          select: {
            balance: true,
          },
        },
        _count: {
          select: {
            streams: true,
            chatMessages: true,
            moderationActions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      displayName: user.profile?.displayName || null,
      avatarUrl: user.profile?.avatarUrl || null,
      isCreator: user.profile?.isCreator || false,
      balance: user.wallet?.balance || 0,
      streamsCount: user._count.streams,
      messagesCount: user._count.chatMessages,
      moderationActionsCount: user._count.moderationActions,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      banExpiresAt: user.banExpiresAt,
      suspendExpiresAt: user.suspendExpiresAt,
      banReason: user.banReason,
      suspendReason: user.suspendReason,
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Ban/unban a user with time-based restrictions
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is moderator or admin
    if (!isAuthorized(sessionUser.role || "")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, action, reason, duration } = body; // Added duration parameter

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["BAN", "UNBAN", "SUSPEND", "ACTIVATE"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Prevent users from banning themselves
    if (userId === sessionUser.id) {
      return NextResponse.json(
        { error: "Cannot perform action on yourself" },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Moderators cannot ban admins
    if (sessionUser.role === "MODERATOR" && targetUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Cannot ban administrators" },
        { status: 403 }
      );
    }

    // Calculate expiration time based on action and duration
    interface UpdateData {
      status?: "ACTIVE" | "BANNED" | "SUSPENDED" | "PENDING_VERIFICATION";
      banReason?: string | null;
      suspendReason?: string | null;
      banExpiresAt?: Date | null;
      suspendExpiresAt?: Date | null;
    }

    const updateData: UpdateData = {};

    switch (action) {
      case "BAN":
        updateData.status = "BANNED";
        updateData.banReason = reason || "Banned by moderator";

        // Set ban expiration time (null means permanent)
        if (duration && duration !== "permanent") {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + duration * 1000); // duration in seconds
          updateData.banExpiresAt = expiresAt;
        } else {
          updateData.banExpiresAt = null; // Permanent ban
        }
        // Clear suspension fields when banning
        updateData.suspendExpiresAt = null;
        updateData.suspendReason = null;
        break;

      case "SUSPEND":
        updateData.status = "SUSPENDED";
        updateData.suspendReason = reason || "Suspended by moderator";

        // Suspension always has a duration
        if (duration) {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + duration * 1000); // duration in seconds
          updateData.suspendExpiresAt = expiresAt;
        } else {
          return NextResponse.json(
            { error: "Suspension requires a duration" },
            { status: 400 }
          );
        }
        // Clear ban fields when suspending
        updateData.banExpiresAt = null;
        updateData.banReason = null;
        break;

      case "ACTIVATE":
      case "UNBAN":
        updateData.status = "ACTIVE";
        updateData.banExpiresAt = null;
        updateData.suspendExpiresAt = null;
        updateData.banReason = null;
        updateData.suspendReason = null;
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        profile: {
          select: {
            displayName: true,
          },
        },
      },
    });

    // Create moderation action record for audit trail
    if (action === "BAN" || action === "SUSPEND") {
      await prisma.moderationAction.create({
        data: {
          targetType: "USER",
          targetId: userId,
          action: action === "BAN" ? "BAN" : "WARN",
          reason: reason || `User ${action.toLowerCase()}ned by moderator`,
          actorId: sessionUser.id,
        },
      });
    }

    return NextResponse.json({
      message: `User ${action.toLowerCase()}ned successfully`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        status: updatedUser.status,
        displayName: updatedUser.profile?.displayName,
        banExpiresAt: updatedUser.banExpiresAt,
        suspendExpiresAt: updatedUser.suspendExpiresAt,
      },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    console.error("Full error details:", JSON.stringify(error, null, 2));

    // Return more specific error message if available
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: "Failed to update user status",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove a user (soft delete by setting status)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete users
    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can delete users" },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent users from deleting themselves
    if (userId === sessionUser.id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For now, we'll do a hard delete
    // In production, you might want to implement soft delete
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: "User deleted successfully",
      deletedUserId: userId,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
