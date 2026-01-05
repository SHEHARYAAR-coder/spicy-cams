"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heart, Gift, ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamActionBarProps {
    likeCount?: number;
    privateShowPrice?: number;
    onLike?: () => void;
    onSendTip?: () => void;
    onPrivateShow?: (minutes: number) => void;
    className?: string;
    isViewer?: boolean; // Show buttons only for viewers, not broadcasters
}

const PRIVATE_SHOW_OPTIONS = [
    { minutes: 5, tokens: 90 },
    { minutes: 10, tokens: 170 },
    { minutes: 15, tokens: 250 },
    { minutes: 30, tokens: 450 },
];

export function StreamActionBar({
    likeCount = 0,
    privateShowPrice = 90,
    onLike,
    onSendTip,
    onPrivateShow,
    className,
    isViewer = true,
}: StreamActionBarProps) {
    const [localLikeCount, setLocalLikeCount] = useState(likeCount);
    const [isLiked, setIsLiked] = useState(false);
    const [showLikeAnimation, setShowLikeAnimation] = useState(false);

    const handleLike = () => {
        setLocalLikeCount((prev) => prev + 1);
        setIsLiked(true);
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 600);
        onLike?.();
    };

    const formatCount = (count: number): string => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}k`;
        }
        return count.toString();
    };

    if (!isViewer) {
        return null; // Don't show action bar for broadcasters
    }

    return (
        <div
            className={cn(
                "absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent",
                className
            )}
        >
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
                {/* Left side - Like button with count */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleLike}
                        className="flex items-center gap-2 group"
                    >
                        <div
                            className={cn(
                                "relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200",
                                "bg-white/10 backdrop-blur-sm border border-white/20",
                                "hover:bg-white/20 active:scale-95",
                                isLiked && "bg-red-500/20 border-red-500/40"
                            )}
                        >
                            <Heart
                                className={cn(
                                    "w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200",
                                    isLiked
                                        ? "text-red-500 fill-red-500"
                                        : "text-white group-hover:text-red-400"
                                )}
                            />
                            {/* Like animation */}
                            {showLikeAnimation && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Heart className="w-8 h-8 text-red-500 fill-red-500 animate-ping" />
                                </div>
                            )}
                        </div>
                        <span className="text-white font-semibold text-sm sm:text-base min-w-[2.5rem]">
                            {formatCount(localLikeCount)}
                        </span>
                    </button>
                </div>

                {/* Right side - Action buttons */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Private Show Button with Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "h-10 sm:h-11 px-3 sm:px-4 rounded-full",
                                    "bg-transparent border-2 border-yellow-500/80 text-white",
                                    "hover:bg-yellow-500/20 hover:border-yellow-400",
                                    "transition-all duration-200 font-semibold text-xs sm:text-sm"
                                )}
                            >
                                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                Private-Show{" "}
                                <span className="text-yellow-400 ml-1 sm:ml-1.5">
                                    {privateShowPrice} Tk
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-1.5 text-gray-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="bg-gray-900/95 backdrop-blur-md border-gray-700 text-white min-w-[200px]"
                            align="end"
                        >
                            <div className="px-3 py-2 border-b border-gray-700/50">
                                <p className="text-xs text-gray-400 font-medium">
                                    Select Duration
                                </p>
                            </div>
                            {PRIVATE_SHOW_OPTIONS.map((option) => (
                                <DropdownMenuItem
                                    key={option.minutes}
                                    onClick={() => onPrivateShow?.(option.minutes)}
                                    className="flex items-center justify-between cursor-pointer hover:bg-gray-800 focus:bg-gray-800 py-2.5"
                                >
                                    <span className="text-sm">
                                        {option.minutes} minutes
                                    </span>
                                    <span className="text-yellow-400 font-semibold text-sm">
                                        {option.tokens} Tk
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Send Tip Button */}
                    <Button
                        onClick={onSendTip}
                        className={cn(
                            "h-10 sm:h-11 px-4 sm:px-5 rounded-full",
                            "bg-gradient-to-r from-green-600 to-green-500",
                            "hover:from-green-500 hover:to-green-400",
                            "text-white font-semibold text-xs sm:text-sm",
                            "shadow-lg shadow-green-600/30",
                            "transition-all duration-200 active:scale-95"
                        )}
                    >
                        <span className="hidden sm:inline">Send Tip</span>
                        <span className="sm:hidden">Tip</span>
                        <Gift className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
