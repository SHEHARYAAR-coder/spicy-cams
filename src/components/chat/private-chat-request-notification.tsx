import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock } from "lucide-react";
import { ChatRequest } from "@/hooks/use-private-chat";
import { cn } from "@/lib/utils";

interface PrivateChatRequestNotificationProps {
    requests: ChatRequest[];
    onAccept: (requestId: string) => void;
    onReject: (requestId: string) => void;
    className?: string;
}

export function PrivateChatRequestNotification({
    requests,
    onAccept,
    onReject,
    className,
}: PrivateChatRequestNotificationProps) {
    if (requests.length === 0) {
        return null;
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <Card className={cn("bg-gray-900 border-gray-700 p-4", className)}>
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <h3 className="font-semibold text-sm text-white">
                    Private Chat Requests
                </h3>
                <Badge className="ml-auto bg-purple-600 text-white border-0">
                    {requests.length}
                </Badge>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {requests.map((request) => (
                    <Card
                        key={request.id}
                        className="bg-gray-800/50 border-gray-700 p-4 hover:bg-gray-800 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <Avatar className="w-12 h-12 ring-2 ring-purple-500/30">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={request.senderImage || "/default-avatar.png"}
                                    alt={request.senderName}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "/default-avatar.png";
                                    }}
                                />
                            </Avatar>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm text-white">
                                        {request.senderName}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="text-xs border-gray-600 text-gray-400"
                                    >
                                        {request.senderRole}
                                    </Badge>
                                </div>

                                {request.initialMessage && (
                                    <p className="text-sm text-gray-300 mb-3 line-clamp-2 bg-gray-700/30 p-2 rounded border-l-2 border-purple-500">
                                        {request.initialMessage}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTimeAgo(request.createdAt)}</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => onAccept(request.id)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg shadow-green-600/25"
                                    >
                                        <Check className="w-4 h-4 mr-1" />
                                        Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onReject(request.id)}
                                        className="flex-1 border-gray-600 text-gray-300 hover:bg-red-600/10 hover:border-red-500 hover:text-red-400"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </Card>
    );
}
