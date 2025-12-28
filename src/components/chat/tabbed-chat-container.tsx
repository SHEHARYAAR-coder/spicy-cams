import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChatContainer, PrivateChatContainer } from "@/components/chat";
import { TipsTab } from "./tips-tab";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Wifi, WifiOff, DollarSign } from "lucide-react";
import { usePrivateChat } from "@/hooks/use-private-chat";
import { useChat } from "@/hooks/use-chat";
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
    const [activeTab, setActiveTab] = useState<"public" | "private" | "tips">("public");
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

    // Get connection status from chat hook for live chat
    const { connected, connectionQuality, messages, sendMessage } = useChat({
        streamId,
        token: chatToken,
        enabled: !!chatToken, // Always enabled to allow sending tips from any tab
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

    // Handle tip
    const handleTip = async (tokens: number, activity?: string) => {
        try {
            console.log(`Tipping ${tokens} tokens${activity ? ` for ${activity}` : ''}`);

            // Check if chat is connected
            if (!connected) {
                alert("Chat is not connected. Please wait and try again.");
                return;
            }

            // TODO: Implement actual tip API call to deduct tokens and credit the model
            // const response = await fetch(`/api/streams/${streamId}/tip`, {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ tokens, activity }),
            // });

            // Send tip message to live chat
            const tipMessage = activity
                ? `💝 Tipped ${tokens} tokens for ${activity}`
                : `💝 Tipped ${tokens} tokens`;

            const success = await sendMessage(tipMessage);

            if (success) {
                // Switch to live chat tab to show the message
                setActiveTab("public");
            } else {
                console.error("sendMessage returned false");
                alert("Failed to send tip message to chat. Please try again.");
            }
        } catch (error) {
            console.error("Error sending tip:", error);
            alert(`Failed to send tip: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <Card className={cn("flex flex-col h-full bg-gray-900 border-gray-700 overflow-hidden", className)}>
            {/* Unified Header - Tabs integrated with chat info */}
            <div className="flex-shrink-0 bg-gray-800/90 backdrop-blur-md border-b border-gray-700/50">
                <div className="flex items-center justify-between px-3 sm:px-4 py-2.5">
                    {/* Tab Pills */}
                    <div className="flex items-center gap-1.5 bg-gray-900/60 rounded-full p-0.5">
                        <button
                            className={cn(
                                "px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap",
                                activeTab === "public"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                            )}
                            onClick={() => setActiveTab("public")}
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Live</span>
                        </button>

                        <button
                            className={cn(
                                "px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 relative whitespace-nowrap",
                                activeTab === "private"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                            )}
                            onClick={() => setActiveTab("private")}
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>DMs</span>
                            {totalNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white">
                                        {totalNotifications > 9 ? "9+" : totalNotifications}
                                    </span>
                                </span>
                            )}
                        </button>

                        <button
                            className={cn(
                                "px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap",
                                activeTab === "tips"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                            )}
                            onClick={() => setActiveTab("tips")}
                        >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Tips</span>
                        </button>
                    </div>

                    {/* User info */}
                    {session && (
                        <div className="flex items-center gap-2 text-xs">
                            {/* Connection status for live chat */}
                            {activeTab === "public" && (
                                <>
                                    {connected ? (
                                        <Wifi className={cn(
                                            "h-3.5 w-3.5",
                                            connectionQuality === 'good' ? 'text-green-400' :
                                                connectionQuality === 'poor' ? 'text-orange-400' : 'text-red-400'
                                        )} />
                                    ) : (
                                        <WifiOff className="h-3.5 w-3.5 text-red-400" />
                                    )}
                                    <span className="text-gray-400 hidden sm:inline">
                                        {messages?.length || 0}
                                    </span>
                                    <div className="w-px h-3 bg-gray-600 hidden sm:block"></div>
                                </>
                            )}
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="hidden sm:inline max-w-[100px] truncate text-gray-400">{session.user?.name}</span>
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
                <div className={cn("absolute inset-0", activeTab === "tips" ? "block" : "hidden")}>
                    <TipsTab
                        onTip={handleTip}
                        className="h-full border-0 rounded-none"
                    />
                </div>
            </div>
        </Card>
    );
}