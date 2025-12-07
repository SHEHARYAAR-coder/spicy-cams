import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChatContainer, PrivateChatContainer } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users } from "lucide-react";
import { usePrivateChat } from "@/hooks/use-private-chat";
import { cn } from "@/lib/utils";

interface TabbedChatContainerProps {
    streamId: string;
    canModerate?: boolean;
    className?: string;
}

export function TabbedChatContainer({
    streamId,
    canModerate = false,
    className,
}: TabbedChatContainerProps) {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<"public" | "private">("public");
    const [chatToken, setChatToken] = useState<string | null>(null);
    const [selectedPrivateUserId, setSelectedPrivateUserId] = useState<string | null>(null);

    // Get chat token for private messages
    useEffect(() => {
        const fetchChatToken = async () => {
            if (!session?.user?.id) return;

            try {
                const response = await fetch(`/api/streams/${streamId}/chat/token`, {
                    method: "POST",
                });

                if (response.ok) {
                    const data = await response.json();
                    setChatToken(data.token);
                }
            } catch (error) {
                console.error("Error fetching chat token:", error);
            }
        };

        fetchChatToken();
    }, [streamId, session]);

    // Get unread private message count and chat requests - always enabled to maintain state
    const { conversations, chatRequests } = usePrivateChat({
        streamId,
        token: chatToken,
        enabled: !!chatToken, // Always enabled when token is available
    });

    const totalUnreadPrivateMessages = conversations.reduce(
        (total, conv) => total + conv.unreadCount,
        0
    );

    // Total notifications = unread messages + pending chat requests
    const totalNotifications = totalUnreadPrivateMessages + chatRequests.length;


    // Handle starting a private conversation
    const handleStartPrivateChat = (userId: string, _userName: string) => {
        setSelectedPrivateUserId(userId);
        setActiveTab("private");
    };

    return (
        <Card className={cn("flex flex-col h-full bg-gray-900 border-gray-700 overflow-hidden", className)}>
            {/* Sleek Header with Tab Pills */}
            <div className="flex-shrink-0 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700/50 px-3 sm:px-4 py-2">
                <div className="flex items-center justify-between gap-3">
                    {/* Tab Pills */}
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-800/60 rounded-full p-1">
                        <button
                            className={cn(
                                "px-2.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
                                activeTab === "public"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                            )}
                            onClick={() => setActiveTab("public")}
                        >
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Live Chat</span>
                            <span className="xs:hidden">Live</span>
                        </button>

                        <button
                            className={cn(
                                "px-2.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 relative whitespace-nowrap",
                                activeTab === "private"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                            )}
                            onClick={() => setActiveTab("private")}
                        >
                            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Private</span>
                            <span className="xs:hidden">DMs</span>
                            {totalNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-[9px] sm:text-[10px] font-bold text-white">
                                        {totalNotifications > 9 ? "9+" : totalNotifications}
                                    </span>
                                </span>
                            )}
                        </button>
                    </div>

                    {/* User info - hidden on very small screens */}
                    {session && (
                        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="max-w-[120px] truncate">{session.user?.name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Content Area - Keep both mounted but toggle visibility */}
            <div className="flex-1 overflow-hidden min-h-0 relative">
                <div className={cn("absolute inset-0", activeTab === "public" ? "block" : "hidden")}>
                    <ChatContainer
                        streamId={streamId}
                        canModerate={canModerate}
                        className="h-full border-0 rounded-none"
                        onStartPrivateChat={handleStartPrivateChat}
                    />
                </div>
                <div className={cn("absolute inset-0", activeTab === "private" ? "block" : "hidden")}>
                    <PrivateChatContainer
                        streamId={streamId}
                        token={chatToken}
                        className="h-full border-0 rounded-none"
                        initialPartnerId={selectedPrivateUserId}
                    />
                </div>
            </div>
        </Card>
    );
}