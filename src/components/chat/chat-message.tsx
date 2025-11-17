import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Ban, Volume2, VolumeX, MessageCircle } from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/hooks/use-chat";

interface ChatMessageProps {
    message: ChatMessageType;
    currentUserId?: string;
    canModerate?: boolean;
    onDelete?: (messageId: string) => void;
    onMute?: (userId: string) => void;
    onBan?: (userId: string) => void;
    onPrivateMessage?: (userId: string, userName: string) => void;
}

export function ChatMessage({
    message,
    currentUserId,
    canModerate = false,
    onDelete,
    onMute,
    onBan,
    onPrivateMessage,
}: ChatMessageProps) {
    const isOwnMessage = message.userId === currentUserId;
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
        VIEWER: null,
    };

    const roleColor = roleColors[message.user.role as keyof typeof roleColors] || roleColors.VIEWER;
    const roleBadge = roleBadges[message.user.role as keyof typeof roleBadges];

    return (
        <div className={`flex items-start gap-3 py-3 px-3 hover:bg-gray-800/30 group rounded-lg transition-all duration-200 border border-transparent hover:border-gray-700/50 ${isPending ? 'opacity-60' : ''}`}>
            {/* Avatar */}
            <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-gray-600/50 hover:ring-purple-500/30 transition-all duration-200">
                {message.user.avatarUrl ? (
                    <img src={message.user.avatarUrl} alt={message.user.displayName} className="rounded-full" />
                ) : (
                    <div className={`${roleColor} w-full h-full flex items-center justify-center text-white text-sm font-semibold rounded-full`}>
                        {message.user.displayName.charAt(0).toUpperCase()}
                    </div>
                )}
            </Avatar>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors">
                        {message.user.displayName}
                    </span>

                    {roleBadge && (
                        <Badge className={`${roleColor} text-white text-xs px-2 py-1 font-medium shadow-sm`}>
                            {roleBadge}
                        </Badge>
                    )}

                    <span className="text-xs text-gray-500 bg-gray-700/30 px-2 py-1 rounded">
                        {isPending ? (
                            <span className="flex items-center gap-1">
                                <span className="animate-pulse">Sending...</span>
                            </span>
                        ) : (
                            new Date(message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                        )}
                    </span>
                </div>

                <div className="text-sm text-gray-200 break-words whitespace-pre-wrap leading-relaxed bg-gray-800/20 rounded-lg p-3 border border-gray-700/30">
                    {message.message}
                </div>
            </div>

            {/* Actions Menu */}
            {!isOwnMessage && (canModerate || onPrivateMessage) && (
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-600/50 hover:border-purple-500/50 transition-all duration-200"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
                            {onPrivateMessage && (
                                <DropdownMenuItem
                                    onClick={() => onPrivateMessage(message.userId, message.user.displayName)}
                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-purple-400 hover:text-purple-300"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Send Private Message
                                </DropdownMenuItem>
                            )}
                            {canModerate && (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => onDelete?.(message.id)}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Message
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onMute?.(message.userId)}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-orange-400 hover:text-orange-300"
                                    >
                                        <VolumeX className="h-4 w-4" />
                                        Mute User (60 min)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onBan?.(message.userId)}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-red-400 hover:text-red-300"
                                    >
                                        <Ban className="h-4 w-4" />
                                        Ban User
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    );
}
