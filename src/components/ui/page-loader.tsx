"use client";

import { Video } from "lucide-react";

interface PageLoaderProps {
    isVisible?: boolean;
}

export function PageLoader({ isVisible = true }: PageLoaderProps = {}) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            <div className="relative flex flex-col items-center gap-6">
                {/* Animated circles */}
                <div className="relative w-24 h-24">
                    {/* Outer rotating circle */}
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />

                    {/* Middle rotating circle - opposite direction */}
                    <div className="absolute inset-2 rounded-full border-4 border-pink-500/20 border-b-pink-500 animate-spin-reverse"
                        style={{ animationDuration: '1s' }} />

                    {/* Inner pulsing circle */}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 animate-pulse flex items-center justify-center">
                        <Video className="w-8 h-8 text-white" />
                    </div>
                </div>

                {/* Loading text */}
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">
                        SpicyCams
                    </h2>
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-400">Loading</span>
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
