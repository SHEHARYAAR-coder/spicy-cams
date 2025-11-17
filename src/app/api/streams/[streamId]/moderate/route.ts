import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createModerationAction } from "@/lib/chat-server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    // Get session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { streamId } = await params;
    const actorId = session.user.id;

    // Check if user is creator, moderator, or admin
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { creatorId: true },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    });

    const isCreator = stream.creatorId === actorId;
    const isModerator = user?.role === "MODERATOR" || user?.role === "ADMIN";

    if (!isCreator && !isModerator) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only creators and moderators can perform moderation actions",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, targetUserId, messageId, duration, reason } = body;

    // Validate action type
    if (!["mute", "ban", "delete", "warn"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      );
    }

    // Process action
    switch (action) {
      case "mute":
        if (!targetUserId) {
          return NextResponse.json(
            { error: "targetUserId required for mute action" },
            { status: 400 }
          );
        }
        await createModerationAction({
          targetType: "USER",
          targetId: targetUserId,
          action: "MUTE",
          actorId,
          reason: `stream:${streamId}:${reason || "No reason provided"}`,
          duration: duration || 60, // Default 60 minutes
        });
        break;

      case "ban":
        if (!targetUserId) {
          return NextResponse.json(
            { error: "targetUserId required for ban action" },
            { status: 400 }
          );
        }
        await createModerationAction({
          targetType: "USER",
          targetId: targetUserId,
          action: "BAN",
          actorId,
          reason: `stream:${streamId}:${reason || "No reason provided"}`,
          duration: duration || undefined, // Permanent if no duration
        });
        break;

      case "delete":
        if (!messageId) {
          return NextResponse.json(
            { error: "messageId required for delete action" },
            { status: 400 }
          );
        }
        await createModerationAction({
          targetType: "MESSAGE",
          targetId: messageId,
          action: "DELETE_MESSAGE",
          actorId,
          reason: reason || "Inappropriate content",
        });
        break;

      case "warn":
        if (!targetUserId) {
          return NextResponse.json(
            { error: "targetUserId required for warn action" },
            { status: 400 }
          );
        }
        await createModerationAction({
          targetType: "USER",
          targetId: targetUserId,
          action: "WARN",
          actorId,
          reason: reason || "Warning issued",
        });
        break;
    }

    return NextResponse.json({
      success: true,
      action,
      message: `${
        action.charAt(0).toUpperCase() + action.slice(1)
      } action applied successfully`,
    });
  } catch (error) {
    console.error("Error processing moderation action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
