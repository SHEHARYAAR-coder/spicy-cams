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
import { MoreVertical, Trash2, Ban, VolumeX, MessageCircle } from "lucide-react";
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
        MODEL: "bg-purple-500",
        MODERATOR: "bg-green-500",
        ADMIN: "bg-red-500",
        VIEWER: "bg-gray-500",
    };

    const roleBadges = {
        MODEL: "Model",
        MODERATOR: "Mod",
        ADMIN: "Admin",
        VIEWER: null,
    };

    const roleColor = roleColors[message.user.role as keyof typeof roleColors] || roleColors.VIEWER;
    const roleBadge = roleBadges[message.user.role as keyof typeof roleBadges];

    return (
        <div className={`group hover:bg-gray-800/20 rounded px-2 py-1.5 transition-colors ${isPending ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-2">
                {/* Avatar */}
                <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                    {message.user.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={message.user.avatarUrl} alt={message.user.displayName} className="rounded-full" />
                    ) : (
                        <div className={`${roleColor} w-full h-full flex items-center justify-center text-white text-xs font-semibold rounded-full`}>
                            {message.user.displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </Avatar>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                    {/* User info and timestamp inline */}
                    <div className="flex items-baseline gap-1.5 flex-wrap mb-0.5">
                        <span className="font-semibold text-xs text-gray-200 truncate">
                            {message.user.displayName}
                        </span>

                        {roleBadge && (
                            <Badge className={`${roleColor} text-white text-xs px-1.5 py-0 h-4 font-medium`}>
                                {roleBadge}
                            </Badge>
                        )}

                        <span className="text-xs text-gray-500">
                            {isPending ? (
                                <span className="animate-pulse">Sending...</span>
                            ) : (
                                new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })
                            )}
                        </span>
                    </div>

                    {/* Message text */}
                    <div className="text-sm text-gray-300 break-words whitespace-pre-wrap leading-relaxed">
                        {message.message}
                    </div>
                </div>

                {/* Actions Menu */}
                {!isOwnMessage && (canModerate || onPrivateMessage) && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700/50"
                                >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
                                {onPrivateMessage && (
                                    <DropdownMenuItem
                                        onClick={() => onPrivateMessage(message.userId, message.user.displayName)}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-purple-400 hover:text-purple-300 text-xs"
                                    >
                                        <MessageCircle className="h-3.5 w-3.5" />
                                        Send Private Message
                                    </DropdownMenuItem>
                                )}
                                {canModerate && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => onDelete?.(message.id)}
                                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-red-400 hover:text-red-300 text-xs"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete Message
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onMute?.(message.userId)}
                                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-orange-400 hover:text-orange-300 text-xs"
                                        >
                                            <VolumeX className="h-3.5 w-3.5" />
                                            Mute User (60 min)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onBan?.(message.userId)}
                                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-red-400 hover:text-red-300 text-xs"
                                        >
                                            <Ban className="h-3.5 w-3.5" />
                                            Ban User
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </div>
    );
}
