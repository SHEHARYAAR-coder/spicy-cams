"use client";

import { useState, useEffect } from "react";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import BlurredMedia from "./blurred-media";

interface MediaItem {
    id: string;
    url: string;
    type: "IMAGE" | "VIDEO";
    isPublic: boolean;
    tokenCost: number;
    fileName?: string;
    sortOrder: number;
    isUnlocked?: boolean;
}

interface MediaGalleryDisplayProps {
    userId: string;
    onImageClick?: (index: number) => void;
}

export default function MediaGalleryDisplay({ userId, onImageClick }: MediaGalleryDisplayProps) {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPrivateCount, setShowPrivateCount] = useState(0);

    useEffect(() => {
        fetchMedia();
    }, [userId]);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/profile/media?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                const mediaList = data.media || [];
                setMedia(mediaList);

                // Count private media
                const privateCount = mediaList.filter((m: MediaItem) => !m.isPublic && !m.isUnlocked).length;
                setShowPrivateCount(privateCount);
            }
        } catch (error) {
            console.error("Error fetching media:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = () => {
        // Refresh media after unlock
        fetchMedia();
    };

    const images = media.filter((m) => m.type === "IMAGE");
    const videos = media.filter((m) => m.type === "VIDEO");

    if (loading) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-700 rounded w-48"></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="aspect-square bg-gray-700 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (media.length === 0) {
        return null; // Don't show section if no media
    }

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    Media Gallery
                </h2>
                {showPrivateCount > 0 && (
                    <div className="flex items-center gap-2 bg-purple-600/20 border border-purple-500/50 rounded-lg px-3 py-1.5">
                        <EyeOff className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-300 font-medium">
                            {showPrivateCount} Private {showPrivateCount === 1 ? "Item" : "Items"}
                        </span>
                    </div>
                )}
            </div>

            {/* Images Section */}
            {images.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-gray-400" />
                        Photos ({images.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((item, index) => {
                            const isPrivateAndLocked = !item.isPublic && !item.isUnlocked;

                            return (
                                <div
                                    key={item.id}
                                    className="relative group aspect-square overflow-hidden rounded-xl bg-gray-900"
                                >
                                    {isPrivateAndLocked ? (
                                        <BlurredMedia
                                            mediaId={item.id}
                                            url={item.url}
                                            type={item.type}
                                            tokenCost={item.tokenCost}
                                            isUnlocked={false}
                                            onUnlock={handleUnlock}
                                            className="w-full h-full"
                                        />
                                    ) : (
                                        <div
                                            className="relative w-full h-full cursor-pointer"
                                            onClick={() => onImageClick && onImageClick(index)}
                                        >
                                            <Image
                                                src={item.url}
                                                alt={item.fileName || `Photo ${index + 1}`}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                                    <Sparkles className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Videos Section */}
            {videos.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-gray-400" />
                        Videos ({videos.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videos.map((item) => {
                            const isPrivateAndLocked = !item.isPublic && !item.isUnlocked;

                            return (
                                <div
                                    key={item.id}
                                    className="relative group rounded-xl overflow-hidden bg-gray-900"
                                >
                                    {isPrivateAndLocked ? (
                                        <BlurredMedia
                                            mediaId={item.id}
                                            url={item.url}
                                            type={item.type}
                                            tokenCost={item.tokenCost}
                                            isUnlocked={false}
                                            onUnlock={handleUnlock}
                                            className="w-full h-60"
                                        />
                                    ) : (
                                        <video
                                            src={item.url}
                                            className="w-full h-auto rounded-xl"
                                            controls
                                            preload="metadata"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
