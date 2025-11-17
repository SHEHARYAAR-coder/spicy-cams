import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrivateConversation } from "@/hooks/use-private-chat";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface ConversationListProps {
    conversations: PrivateConversation[];
    selectedPartnerId?: string;
    onSelectConversation: (partnerId: string) => void;
    className?: string;
}

export function ConversationList({
    conversations,
    selectedPartnerId,
    onSelectConversation,
    className,
}: ConversationListProps) {
    const roleColors = {
        CREATOR: "bg-purple-500",
        MODERATOR: "bg-green-500",
        ADMIN: "bg-red-500",
        VIEWER: "bg-gray-500",
    };

    const formatLastMessage = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    if (conversations.length === 0) {
        return (
            <div className={cn("flex flex-col items-center justify-center p-8", className)}>
                <div className="text-center bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageCircle className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-300 font-medium mb-1">No active conversations</p>
                    <p className="text-xs text-gray-500">Start messaging to see your chats here</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-2", className)}>
            {conversations.map((conversation) => (
                <Button
                    key={conversation.partnerId}
                    variant="ghost"
                    className={cn(
                        "w-full justify-start p-4 h-auto rounded-lg transition-all duration-200 border border-transparent",
                        selectedPartnerId === conversation.partnerId
                            ? "bg-purple-600/20 border-purple-500/30 text-white shadow-lg shadow-purple-600/10"
                            : "bg-gray-800/30 hover:bg-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-white"
                    )}
                    onClick={() => onSelectConversation(conversation.partnerId)}
                >
                    <div className="flex items-center gap-4 w-full">
                        {/* Avatar */}
                        <div className="relative">
                            <Avatar className="w-12 h-12 ring-2 ring-gray-600/50 transition-all duration-200 group-hover:ring-purple-500/30">
                                <img
                                    src={conversation.partnerImage || "/default-avatar.png"}
                                    alt={conversation.partnerName}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "/default-avatar.png";
                                    }}
                                />
                            </Avatar>
                            {conversation.partnerRole !== "VIEWER" && (
                                <div
                                    className={cn(
                                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 shadow-sm",
                                        roleColors[conversation.partnerRole as keyof typeof roleColors] ||
                                        "bg-gray-500"
                                    )}
                                />
                            )}
                        </div>

                        {/* Conversation info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-left truncate">
                                    {conversation.partnerName}
                                </p>
                                <span className="text-xs text-gray-400 flex-shrink-0 bg-gray-700/30 px-2 py-1 rounded">
                                    {formatLastMessage(conversation.lastMessageAt)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-purple-300 capitalize flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                    {conversation.partnerRole.toLowerCase()}
                                </span>
                                {conversation.unreadCount > 0 && (
                                    <Badge
                                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded-full min-w-[22px] h-6 flex items-center justify-center shadow-lg shadow-purple-600/25 animate-pulse"
                                    >
                                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </Button>
            ))}
        </div>
    );
}