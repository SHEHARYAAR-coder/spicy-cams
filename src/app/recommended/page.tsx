"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StreamCard } from "@/components/stream";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Video } from "lucide-react";

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
}

export default function RecommendedPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [streams, setStreams] = useState<Stream[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        searchParams.get("category")
    );

    const categories = [
        { name: "All", value: null },
        { name: "Girls", value: "girls" },
        { name: "Couples", value: "couples" },
        { name: "Guys", value: "guys" },
        { name: "Trans", value: "trans" },
    ];

    const fetchRecommendations = async (category: string | null) => {
        setLoading(true);
        try {
            const url = category
                ? `/api/recommendations?category=${category}`
                : "/api/recommendations";
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                const streamsWithDates = (data.streams || []).map(
                    (stream: StreamApiResponse) => ({
                        ...stream,
                        createdAt: new Date(stream.createdAt),
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
            console.error("Error fetching recommendations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!session) {
            router.push("/");
            return;
        }
        fetchRecommendations(selectedCategory);
    }, [session, selectedCategory, router]);

    const handleCategoryChange = (category: string | null) => {
        setSelectedCategory(category);
        if (category) {
            router.push(`/recommended?category=${category}`);
        } else {
            router.push("/recommended");
        }
    };

    const handleJoinStream = (streamId: string) => {
        window.location.href = `/streaming?join=${streamId}`;
    };

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
            <div className="container mx-auto px-4 py-8 mt-24">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="w-8 h-8 text-purple-400" />
                        <h1 className="text-3xl font-bold">Recommended For You</h1>
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-3 flex-wrap">
                        {categories.map((cat) => (
                            <Button
                                key={cat.name}
                                onClick={() => handleCategoryChange(cat.value)}
                                variant={selectedCategory === cat.value ? "default" : "outline"}
                                className={
                                    selectedCategory === cat.value
                                        ? "bg-purple-600 hover:bg-purple-700"
                                        : "border-gray-600 text-gray-300 hover:bg-gray-800"
                                }
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
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
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {streams.map((stream) => (
                            <StreamCard
                                key={stream.id}
                                stream={stream}
                                onJoinStream={handleJoinStream}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="border-2 border-dashed border-gray-700 bg-gray-800">
                        <CardContent className="p-12 text-center">
                            <Sparkles className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">
                                No Recommendations Yet
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Watch some streams to get personalized recommendations!
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
