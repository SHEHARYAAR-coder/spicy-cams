import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/streams/[streamId]/private-conversations - Get list of users with private conversations

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const { streamId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all unique conversation partners for this user in this stream
    const conversations = await prisma.privateMessage.findMany({
      where: {
        streamId,
        OR: [{ senderId: userId }, { receiverId: userId }],
        isDeleted: false,
      },
      select: {
        senderId: true,
        receiverId: true,
        createdAt: true,
        isRead: true,
        sender: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by conversation partner and get latest message + unread count
    const conversationMap = new Map();

    conversations.forEach((msg) => {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partnerName: partner.profile?.displayName || "Anonymous",
          partnerImage: partner.profile?.avatarUrl,
          partnerRole: partner.role,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        });
      }

      // Count unread messages (messages sent TO current user that are unread)
      if (msg.receiverId === userId && !msg.isRead) {
        const conversation = conversationMap.get(partnerId);
        conversation.unreadCount += 1;
      }

      // Update last message time if this is more recent
      const conversation = conversationMap.get(partnerId);
      if (msg.createdAt > conversation.lastMessageAt) {
        conversation.lastMessageAt = msg.createdAt;
      }
    });

    const conversationList = Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );

    return NextResponse.json({ conversations: conversationList });
  } catch (error) {
    console.error("Error fetching private conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
