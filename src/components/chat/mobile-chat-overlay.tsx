"use client";

import React, { useState } from "react";
import { TabbedChatContainer } from "./tabbed-chat-container";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileChatOverlayProps {
    streamId: string;
    canModerate?: boolean;
}

export function MobileChatOverlay({ streamId, canModerate = false }: MobileChatOverlayProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Chat Button - Only visible on mobile/tablet */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-24 right-4 lg:hidden z-40 h-14 w-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-2xl shadow-purple-600/50 p-0 flex items-center justify-center"
                >
                    <MessageCircle className="w-6 h-6 text-white" />
                    <span className="absolute -top-1 -right-1 flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-6 w-6 bg-red-500 text-xs font-bold text-white">
                            💬
                        </span>
                    </span>
                </Button>
            )}

            {/* Chat Overlay - Slides up from bottom on mobile */}
            <div
                className={cn(
                    "fixed inset-x-0 bottom-0 lg:hidden z-50 transition-transform duration-300 ease-out",
                    isOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                {/* Backdrop */}
                <div
                    className={cn(
                        "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    onClick={() => setIsOpen(false)}
                />

                {/* Chat Container */}
                <div className="relative bg-gray-900 rounded-t-3xl shadow-2xl h-[70vh] flex flex-col">
                    {/* Drag Handle */}
                    <div className="flex items-center justify-center pt-3 pb-2">
                        <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
                    </div>

                    {/* Close Button - Positioned absolutely */}
                    <Button
                        onClick={() => setIsOpen(false)}
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3 z-20 h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    {/* Chat Content */}
                    <div className="flex-1 overflow-hidden">
                        <TabbedChatContainer
                            streamId={streamId}
                            canModerate={canModerate}
                            className="h-full border-0 rounded-none"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
