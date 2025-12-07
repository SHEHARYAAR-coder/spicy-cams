import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/streams/[streamId]/chat-requests/[requestId] - Accept or reject a chat request

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string; requestId: string }> }
) {
  try {
    const { streamId, requestId } = await params;
    const { action } = await request.json();

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch the chat request
    const chatRequest = await prisma.privateChatRequest.findUnique({
      where: { id: requestId },
      include: {
        stream: true,
      },
    });

    if (!chatRequest) {
      return NextResponse.json(
        { error: "Chat request not found" },
        { status: 404 }
      );
    }

    // Verify the stream matches
    if (chatRequest.streamId !== streamId) {
      return NextResponse.json(
        { error: "Stream mismatch" },
        { status: 400 }
      );
    }

    // model)
    if (chatRequest.receiverId !== userId) {
      return NextResponse.json(
        { error: "Only the receiver can respond to this request" },
        { status: 403 }
      );
    }

    // Check if request is still pending
    if (chatRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: `Request already ${chatRequest.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check if request has expired
    if (chatRequest.expiresAt && chatRequest.expiresAt < new Date()) {
      // Mark as expired
      await prisma.privateChatRequest.update({
        where: { id: requestId },
        data: {
          status: "EXPIRED",
          respondedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: "Chat request has expired" },
        { status: 400 }
      );
    }

    // Update the request status
    const updatedRequest = await prisma.privateChatRequest.update({
      where: { id: requestId },
      data: {
        status: action === "accept" ? "ACCEPTED" : "REJECTED",
        respondedAt: new Date(),
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    return NextResponse.json({
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        senderId: updatedRequest.senderId,
        senderName: updatedRequest.sender.profile?.displayName || "Anonymous",
        respondedAt: updatedRequest.respondedAt,
      },
    });
  } catch (error) {
    console.error("Error updating chat request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
