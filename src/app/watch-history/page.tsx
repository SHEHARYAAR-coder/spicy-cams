"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StreamCard } from "@/components/stream";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { History, Video } from "lucide-react";

interface Stream {
    id: string;
    title: string;
    description: string;
    status: "LIVE" | "SCHEDULED" | "ENDED";
    category?: string;
    tags?: string[];
    thumbnailUrl?: string;
    createdAt: Date;
    model: {
        id: string;
        name: string;
        image?: string;
    };
    participantCount?: number;
    watchedAt?: Date;
}

interface StreamApiResponse {
    id: string;
    title: string;
    description: string;
    status: "LIVE" | "SCHEDULED" | "ENDED";
    category?: string;
    tags?: string[];
    thumbnailUrl?: string;
    createdAt: string;
    model: {
        id: string;
        name: string;
        avatar?: string;
        image?: string;
    };
    participantCount?: number;
    watchedAt?: string;
}

export default function WatchHistoryPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [streams, setStreams] = useState<Stream[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWatchHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/watch-history");
            if (response.ok) {
                const data = await response.json();
                const streamsWithDates = (data.streams || []).map(
                    (stream: StreamApiResponse) => ({
                        ...stream,
                        createdAt: new Date(stream.createdAt),
                        watchedAt: stream.watchedAt ? new Date(stream.watchedAt) : undefined,
                        model: {
                            id: stream.model.id,
                            name: stream.model.name,
                            image: stream.model.avatar || stream.model.image,
                        },
                    })
                );
                setStreams(streamsWithDates);
            }
        } catch (error) {
            console.error("Error fetching watch history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!session) {
            router.push("/");
            return;
        }
        fetchWatchHistory();
    }, [session]);

    const handleJoinStream = (streamId: string) => {
        window.location.href = `/streaming?join=${streamId}`;
    };

    const formatDate = (date?: Date) => {
        if (!date) return "";
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
            <div className="container mx-auto px-4 py-8 mt-24">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <History className="w-8 h-8 text-purple-400" />
                        <h1 className="text-3xl font-bold">Watch History</h1>
                    </div>
                    <p className="text-gray-400">
                        Your recently watched streams
                    </p>
                </div>

                {loading ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <Card
                                key={i}
                                className="animate-pulse bg-gray-800 border-gray-700"
                            >
                                <CardContent className="p-0">
                                    <div className="aspect-video bg-gray-700 rounded-t-lg" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-4 bg-gray-700 rounded w-3/4" />
                                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : streams.length > 0 ? (
                    <div className="space-y-6">
                        {streams.map((stream) => (
                            <div key={stream.id} className="flex flex-col sm:flex-row gap-4 items-start">
                                <div className="w-full sm:w-80 flex-shrink-0">
                                    <StreamCard
                                        stream={stream}
                                        onJoinStream={handleJoinStream}
                                    />
                                </div>
                                <div className="flex-1 pt-2">
                                    <h3 className="text-lg font-semibold mb-2">{stream.title}</h3>
                                    <p className="text-gray-400 text-sm mb-2">
                                        {stream.description}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>Watched {formatDate(stream.watchedAt)}</span>
                                        {stream.category && (
                                            <>
                                                <span>•</span>
                                                <span className="text-purple-400">{stream.category}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Card className="border-2 border-dashed border-gray-700 bg-gray-800">
                        <CardContent className="p-12 text-center">
                            <History className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">
                                No Watch History Yet
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Start watching streams to build your history!
                            </p>
                            <Link href="/">
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                    <Video className="w-4 h-4 mr-2" />
                                    Browse Streams
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
