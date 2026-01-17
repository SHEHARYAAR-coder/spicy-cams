"use client";

import { useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface BlurredMediaProps {
    mediaId: string;
    url: string;
    type: "IMAGE" | "VIDEO";
    tokenCost: number;
    isUnlocked: boolean;
    onUnlock?: () => void;
    className?: string;
}

export default function BlurredMedia({
    mediaId,
    url,
    type,
    tokenCost,
    isUnlocked,
    onUnlock,
    className = "",
}: BlurredMediaProps) {
    const [unlocking, setUnlocking] = useState(false);
    const [localUnlocked, setLocalUnlocked] = useState(isUnlocked);

    const handleUnlock = async () => {
        setUnlocking(true);
        try {
            const response = await fetch("/api/profile/media/unlock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mediaId }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setLocalUnlocked(true);
                    if (onUnlock) onUnlock();
                }
            } else {
                const error = await response.json();
                if (error.error === "Insufficient tokens") {
                    alert(`You need ${error.required} tokens but only have ${error.balance.toFixed(2)}. Please purchase more tokens.`);
                } else {
                    alert(error.error || "Failed to unlock media");
                }
            }
        } catch (error) {
            console.error("Unlock error:", error);
            alert("Failed to unlock media. Please try again.");
        } finally {
            setUnlocking(false);
        }
    };

    if (localUnlocked) {
        // Show the media without blur
        if (type === "IMAGE") {
            return (
                <div className={`relative ${className}`}>
                    <Image
                        src={url}
                        alt="Unlocked media"
                        fill
                        className="object-cover"
                    />
                </div>
            );
        } else {
            return (
                <video
                    src={url}
                    className={`w-full ${className}`}
                    controls
                    preload="metadata"
                />
            );
        }
    }

    // Show blurred media with unlock button
    return (
        <div className={`relative ${className}`}>
            {type === "IMAGE" ? (
                <div className="relative w-full h-full">
                    <Image
                        src={url}
                        alt="Private media"
                        fill
                        className="object-cover blur-3xl scale-110"
                    />
                </div>
            ) : (
                <div className="relative w-full h-full bg-gray-900">
                    <video
                        src={url}
                        className="w-full h-full object-cover blur-3xl scale-110"
                        muted
                        preload="metadata"
                    />
                </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6">
                <div className="bg-purple-600/20 backdrop-blur-sm border-2 border-purple-500/50 rounded-full p-4">
                    <Lock className="w-8 h-8 text-purple-400" />
                </div>

                <div className="text-center">
                    <h3 className="text-white font-semibold text-lg mb-1">Private Content</h3>
                    <p className="text-gray-300 text-sm">
                        Unlock this {type.toLowerCase()} to view
                    </p>
                </div>

                <Button
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105"
                >
                    <Sparkles className="w-5 h-5" />
                    {unlocking ? "Unlocking..." : `Unlock for ${tokenCost} Tokens`}
                </Button>

                <p className="text-xs text-gray-400 max-w-xs text-center">
                    Unlock once, access forever
                </p>
            </div>
        </div>
    );
}
