import { prisma } from "@/lib/prisma";
import { StreamManagement } from "@/components/admin/stream-management";

export const metadata = {
  title: "Stream Management - Admin",
  description: "Manage all streams on the platform",
};

export default async function AdminStreamsPage() {
  // Fetch all streams with creator details and analytics
  // Admin check is handled in layout.tsx
  const streams = await prisma.stream.findMany({
    include: {
      creator: {
        include: {
          profile: true,
        },
      },
      sessions: {
        select: {
          id: true,
          status: true,
          totalWatchMs: true,
        },
      },
      chatMessages: {
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          sessions: true,
          chatMessages: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform data for the component
  const streamData = streams.map((stream) => ({
    id: stream.id,
    title: stream.title,
    description: stream.description,
    category: stream.category,
    status: stream.status,
    creatorId: stream.creatorId,
    creatorName: stream.creator.profile?.displayName || stream.creator.email,
    creatorEmail: stream.creator.email,
    creatorAvatar: stream.creator.profile?.avatarUrl || null,
    thumbnailUrl: stream.thumbnailUrl,
    livekitRoomName: stream.livekitRoomName,
    recordingEnabled: stream.recordingEnabled,
    recordingUrl: stream.recordingUrl,
    scheduledAt: stream.scheduledAt?.toISOString() || null,
    startedAt: stream.startedAt?.toISOString() || null,
    endedAt: stream.endedAt?.toISOString() || null,
    createdAt: stream.createdAt.toISOString(),
    updatedAt: stream.updatedAt.toISOString(),
    totalSessions: stream._count.sessions,
    totalMessages: stream._count.chatMessages,
    activeSessions: stream.sessions.filter((s) => s.status === "active").length,
    totalWatchTimeMs: stream.sessions.reduce(
      (total, session) => total + session.totalWatchMs,
      0
    ),
  }));

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-white">Stream Management</h1>
      <StreamManagement streams={streamData} />
    </>
  );
}
