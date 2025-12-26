"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Eye,
    Clock,
    Play,
    Users,
    Tag,
    FolderOpen,
    Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StreamCardProps {
    stream: {
        id: string;
        title: string;
        description?: string;
        category?: string;
        tags?: string[];
        status: 'LIVE' | 'SCHEDULED' | 'ENDED';
        createdAt: Date;
        scheduledFor?: Date;
        model: {
            id: string;
            name: string;
            image?: string;
        };
        participantCount?: number;
        thumbnailUrl?: string;
    };
    onJoinStream?: (streamId: string) => void;
    className?: string;
}

export function StreamCard({
    stream,
    onJoinStream,
    className = ""
}: StreamCardProps) {
    const [participantCount, setParticipantCount] = useState(stream.participantCount || 0);
    const [isHovered, setIsHovered] = useState(false);

    // Poll for participant count if stream is live
    useEffect(() => {
        if (stream.status !== 'LIVE') return;

        const pollParticipants = async () => {
            try {
                const response = await fetch(`/api/streams/${stream.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setParticipantCount(data.participantCount || 0);
                }
            } catch (error) {
                console.error('Error fetching participant count:', error);
            }
        };

        pollParticipants();
        const interval = setInterval(pollParticipants, 30000);
        return () => clearInterval(interval);
    }, [stream.id, stream.status]);

    const handleJoinStream = () => {
        onJoinStream?.(stream.id);
    };

    const getStatusBadge = () => {
        switch (stream.status) {
            case 'LIVE':
                return (
                    <div className="absolute top-2 left-2 z-10">
                        <div className="bg-red-600 text-white px-1.5 py-0.5 text-xs font-medium flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                        </div>
                    </div>
                );
            case 'SCHEDULED':
                return (
                    <div className="absolute top-2 left-2 z-10">
                        <div className="bg-purple-600 text-white px-1.5 py-0.5 text-xs font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            SCHEDULED
                        </div>
                    </div>
                );
            case 'ENDED':
                return (
                    <div className="absolute top-2 left-2 z-10">
                        <div className="bg-gray-600 text-white px-1.5 py-0.5 text-xs font-medium">
                            ENDED
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getTimeDisplay = () => {
        if (stream.status === 'SCHEDULED' && stream.scheduledFor) {
            return `Starts ${formatDistanceToNow(new Date(stream.scheduledFor), { addSuffix: true })}`;
        }
        if (stream.status === 'LIVE') {
            return `${participantCount} watching`;
        }
        return formatDistanceToNow(new Date(stream.createdAt), { addSuffix: true });
    };

    return (
        <Card
            className={`rounded-none p-0 w-full group cursor-pointer transition-all duration-200 hover:shadow-lg bg-gray-800 border border-gray-700 hover:border-purple-600 overflow-hidden ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleJoinStream}
        >
            {/* Thumbnail Wrapper with fixed height */}
            <div className="relative w-full aspect-[4/3] bg-gray-700 overflow-hidden">
                {/* Thumbnail Image */}
                {stream.thumbnailUrl ? (
                    <img
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        className="w-full h-full object-cover object-center"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-gray-800 flex flex-col items-center justify-center">
                        <Play className="w-12 h-12 text-gray-500 mb-2" />
                        <div className="text-xs text-gray-500 text-center px-4">
                            <div className="font-medium truncate">{stream.title}</div>
                            {stream.category && (
                                <div className="text-purple-400 mt-1">{stream.category}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Status Badge */}
                {getStatusBadge()}



                {/* Viewer Count */}
                {/* <div className="absolute bottom-3 right-3 z-10">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {stream.status === 'LIVE' ? participantCount : Math.floor(Math.random() * 100) + 10}
                    </div>
                </div> */}

                {/* Region */}
                <div className="absolute bottom-2 left-2 z-10">
                    <div className="text-white px-1.5 py-0.5 text-xs font-bold">
                        {/* {['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'BR', 'RO', 'CO'][Math.floor(Math.random() * 10)]} */}
                        <div className="flex items-center gap-1.5">
                            {/* <Avatar className="w-8 h-8">
                                <AvatarImage src={stream.model.image} />
                                <AvatarFallback className="text-xs">
                                    {stream.model.name?.charAt(0).toUpperCase() || 'M'}
                                </AvatarFallback>
                            </Avatar> */}
                            <p className="text-xs font-medium text-gray-200 truncate">
                                {stream.model.name || 'Unknown Model'}
                            </p>
                        </div>
                    </div>
                </div>


            </div>

            {/* <CardContent className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={stream.model.image} />
                        <AvatarFallback className="text-xs">
                            {stream.model.name?.charAt(0).toUpperCase() || 'M'}
                        </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium text-gray-200 truncate">
                        {stream.model.name || 'Unknown Model'}
                    </p>
                </div>
            </CardContent> */}
        </Card>
    );
}

// Skeleton loader for loading states
export function StreamCardSkeleton() {
    return (
        <Card className="rounded-none animate-pulse bg-gray-800 border-gray-700 overflow-hidden">
            <div className="w-full aspect-[4/3] bg-gray-700" />
            <CardContent className="p-4">
                <div className="h-6 bg-gray-700 mb-2 w-3/4" />
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full" />
                    <div>
                        <div className="h-4 bg-gray-700 w-24 mb-1" />
                        <div className="h-3 bg-gray-700 w-16" />
                    </div>
                </div>
                <div className="h-4 bg-gray-700 mb-2 w-full" />
                <div className="h-4 bg-gray-700 w-1/2 mb-3" />
                <div className="h-8 bg-gray-700 w-28" />
            </CardContent>
        </Card>
    );
}
