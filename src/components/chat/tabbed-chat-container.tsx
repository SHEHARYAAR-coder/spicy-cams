import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChatContainer, PrivateChatContainer } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, MessageSquare } from "lucide-react";
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

    // Get unread private message count
    const { conversations } = usePrivateChat({
        streamId,
        token: chatToken,
        enabled: !!chatToken && activeTab === "private",
    });

    const totalUnreadPrivateMessages = conversations.reduce(
        (total, conv) => total + conv.unreadCount,
        0
    );

    // Handle starting a private conversation
    const handleStartPrivateChat = (userId: string, userName: string) => {
        setSelectedPrivateUserId(userId);
        setActiveTab("private");
    };

    return (
        <Card className={cn("flex flex-col h-full bg-gray-900 border-gray-700", className)}>
            {/* Tab Header */}
            <div className="flex border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                <Button
                    variant={activeTab === "public" ? "default" : "ghost"}
                    className={cn(
                        "flex-1 rounded-none border-0 justify-center gap-2 text-white transition-all duration-200",
                        activeTab === "public"
                            ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20"
                            : "bg-transparent hover:bg-gray-700/50 text-gray-300 hover:text-white"
                    )}
                    onClick={() => setActiveTab("public")}
                >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Live Chat</span>
                    <span className="sm:hidden">Live</span>
                </Button>

                <Button
                    variant={activeTab === "private" ? "default" : "ghost"}
                    className={cn(
                        "flex-1 rounded-none border-0 justify-center gap-2 relative text-white transition-all duration-200",
                        activeTab === "private"
                            ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20"
                            : "bg-transparent hover:bg-gray-700/50 text-gray-300 hover:text-white"
                    )}
                    onClick={() => setActiveTab("private")}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Private</span>
                    <span className="sm:hidden">DMs</span>
                    {totalUnreadPrivateMessages > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs min-w-[18px] h-5 rounded-full bg-red-500 text-white border border-red-400 shadow-lg animate-pulse"
                        >
                            {totalUnreadPrivateMessages > 99 ? "99+" : totalUnreadPrivateMessages}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "public" ? (
                    <ChatContainer
                        streamId={streamId}
                        canModerate={canModerate}
                        className="h-full border-0 rounded-none"
                        onStartPrivateChat={handleStartPrivateChat}
                    />
                ) : (
                    <PrivateChatContainer
                        streamId={streamId}
                        token={chatToken}
                        className="h-full border-0 rounded-none"
                        initialPartnerId={selectedPrivateUserId}
                    />
                )}
            </div>

            {/* Footer info */}
            <div className="border-t border-gray-700 px-3 py-2 bg-gray-800/30 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                        {activeTab === "public" ? "Stream Chat" : "Private Messages"}
                    </span>
                    {session && (
                        <span className="text-purple-400 font-medium">
                            Signed in as {session.user?.name}
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );
}