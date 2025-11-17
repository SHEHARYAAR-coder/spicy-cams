import { NextRequest, NextResponse } from "next/server";
import { getRecentMessages } from "@/lib/chat-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const { streamId } = await params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "100");
    const beforeId = searchParams.get("before") || undefined;

    // Validate limit
    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: "Invalid limit. Must be between 1 and 200." },
        { status: 400 }
      );
    }

    // Get messages
    const messages = await getRecentMessages(streamId, limit, beforeId);

    // Format messages for response
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      streamId: msg.streamId,
      userId: msg.userId,
      message: msg.message,
      isDeleted: msg.isDeleted,
      createdAt: msg.createdAt.toISOString(),
      user: {
        id: msg.user.id,
        displayName: msg.user.profile?.displayName || "Anonymous",
        avatarUrl: msg.user.profile?.avatarUrl || null,
        role: msg.user.role,
      },
    }));

    return NextResponse.json({
      messages: formattedMessages,
      count: formattedMessages.length,
      hasMore: formattedMessages.length === limit,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
