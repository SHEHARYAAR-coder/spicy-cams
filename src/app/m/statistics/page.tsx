import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { MyStreamsContent } from "@/components/model/my-streams-content";

export const metadata = {
    title: "My Streams - Model Studio",
    description: "Manage and view all your streams",
};

export default async function MyStreamsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/m/login");
    }

    const userId = (session.user as { id: string; role?: string }).id;
    const userRole = (session.user as { id: string; role?: string }).role;

    // Only models and admins can access this page
    if (userRole !== UserRole.MODEL && userRole !== UserRole.ADMIN) {
        redirect("/dashboard");
    }

    // Fetch user's streams with detailed information
    const streams = await prisma.stream.findMany({
        where: {
            modelId: userId,
        },
        include: {
            sessions: {
                select: {
                    id: true,
                    status: true,
                    totalWatchMs: true,
                    createdAt: true,
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
        tags: stream.tags,
        status: stream.status,
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
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">My Streams</h1>
                <p className="text-gray-400">
                    Manage all your streams, track analytics, and engage with your audience
                </p>
            </div>

            <MyStreamsContent streams={streamData} />
        </>
    );
}
