import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PrivateMessage } from "@/hooks/use-private-chat";
import { cn } from "@/lib/utils";

interface PrivateMessageBubbleProps {
    message: PrivateMessage;
    isOwnMessage: boolean;
    showAvatar?: boolean;
}

export function PrivateMessageBubble({
    message,
    isOwnMessage,
    showAvatar = true,
}: PrivateMessageBubbleProps) {
    const isPending = message.isPending || false;
    
    const roleColors = {
        CREATOR: "bg-purple-500",
        MODERATOR: "bg-green-500",
        ADMIN: "bg-red-500",
        VIEWER: "bg-gray-500",
    };

    const roleBadges = {
        CREATOR: "Creator",
        MODERATOR: "Mod",
        ADMIN: "Admin",
        VIEWER: "",
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            className={cn(
                "flex gap-3 px-2 py-3 group transition-all duration-200 hover:bg-gray-800/20 rounded-lg",
                isOwnMessage ? "flex-row-reverse" : "flex-row",
                isPending ? "opacity-60" : ""
            )}
        >
            {showAvatar && (
                <div className="flex-shrink-0">
                    <div className="relative">
                        <Avatar className="w-9 h-9 ring-2 ring-gray-600/30 hover:ring-purple-500/30 transition-all duration-200">
                            <img
                                src={message.sender.image || "/default-avatar.png"}
                                alt={message.sender.name}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/default-avatar.png";
                                }}
                            />
                        </Avatar>
                        {message.sender.role !== "VIEWER" && (
                            <div
                                className={cn(
                                    "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-gray-800 shadow-sm",
                                    roleColors[message.sender.role as keyof typeof roleColors] ||
                                    "bg-gray-500"
                                )}
                            />
                        )}
                    </div>
                </div>
            )}

            <div
                className={cn(
                    "flex flex-col max-w-[70%]",
                    isOwnMessage ? "items-end" : "items-start"
                )}
            >
                {/* Sender info */}
                {showAvatar && !isOwnMessage && (
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {message.sender.name}
                        </span>
                        {roleBadges[message.sender.role as keyof typeof roleBadges] && (
                            <Badge
                                className={cn(
                                    "text-xs px-2 py-1 text-white border-0 font-medium shadow-sm",
                                    roleColors[message.sender.role as keyof typeof roleColors] ||
                                    "bg-gray-500"
                                )}
                            >
                                {roleBadges[message.sender.role as keyof typeof roleBadges]}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Message bubble */}
                <div
                    className={cn(
                        "rounded-2xl px-4 py-3 max-w-full break-words text-sm leading-relaxed shadow-sm border transition-all duration-200",
                        isOwnMessage
                            ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white border-purple-500/30 shadow-purple-600/20"
                            : "bg-gray-800/60 backdrop-blur-sm text-gray-200 border-gray-700/50 hover:border-gray-600/50"
                    )}
                >
                    {message.message}
                </div>

                {/* Timestamp */}
                <span className="text-xs text-gray-500 mt-2 bg-gray-700/30 px-2 py-1 rounded">
                    {isPending ? (
                        <span className="flex items-center gap-1">
                            <span className="animate-pulse">Sending...</span>
                        </span>
                    ) : (
                        formatTime(message.createdAt)
                    )}
                </span>
            </div>
        </div>
    );
}