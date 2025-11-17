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
        creator: {
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
                    <div className="absolute top-3 left-3 z-10">
                        <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            LIVE
                        </div>
                    </div>
                );
            case 'SCHEDULED':
                return (
                    <div className="absolute top-3 left-3 z-10">
                        <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            SCHEDULED
                        </div>
                    </div>
                );
            case 'ENDED':
                return (
                    <div className="absolute top-3 left-3 z-10">
                        <div className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium">
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
            className={`p-0 w-full group cursor-pointer transition-all duration-200 hover:shadow-lg bg-gray-800 border border-gray-700 hover:border-purple-600 rounded-lg overflow-hidden ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleJoinStream}
        >
            {/* Thumbnail Wrapper with fixed height */}
            <div className="relative w-full h-48 sm:h-52 md:h-56 lg:h-60 bg-gray-700 overflow-hidden">
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

                {/* Star Rating */}
                <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-3 h-3 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Viewer Count */}
                <div className="absolute bottom-3 right-3 z-10">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {stream.status === 'LIVE' ? participantCount : Math.floor(Math.random() * 100) + 10}
                    </div>
                </div>

                {/* Region */}
                <div className="absolute bottom-3 left-3 z-10">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold">
                        {['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'BR', 'RO', 'CO'][Math.floor(Math.random() * 10)]}
                    </div>
                </div>

                {/* Hover Overlay */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                    <div className="w-16 h-16 bg-purple-600/50 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-purple-500/70">
                        <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                </div>
            </div>

            <CardContent className="px-4 pb-4">
                <h3 className="font-semibold text-base mb-2 line-clamp-2 text-white group-hover:text-purple-400 transition-colors">
                    {stream.title}
                </h3>

                <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-6 h-6">
                        <AvatarImage src={stream.creator.image} />
                        <AvatarFallback className="text-xs">
                            {stream.creator.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-200 truncate">
                                {stream.creator.name}
                            </p>
                            <span className="text-xs text-gray-400 bg-gray-700 px-1 rounded">
                                {18 + Math.floor(Math.random() * 12)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${stream.status === 'LIVE' ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                                <span className="text-xs text-gray-400">
                                    {stream.status === 'LIVE' ? 'Online' : 'Offline'}
                                </span>
                            </div>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">{getTimeDisplay()}</span>
                        </div>
                    </div>
                </div>

                {stream.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                        {stream.description}
                    </p>
                )}

                {stream.category && (
                    <div className="flex items-center gap-1 mb-2">
                        <FolderOpen className="w-3 h-3 text-purple-400" />
                        <span className="text-xs font-medium text-purple-400 bg-purple-600/20 px-2 py-1 rounded-full border border-purple-500/30">
                            {stream.category}
                        </span>
                    </div>
                )}

                {stream.tags && stream.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {stream.tags.slice(0, 2).map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs border border-gray-600/50"
                            >
                                <Tag className="w-2.5 h-2.5" />
                                {tag}
                            </span>
                        ))}
                        {stream.tags.length > 2 && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-gray-600/50 text-gray-400 rounded text-xs">
                                +{stream.tags.length - 2}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-center">
                    {stream.status === 'LIVE' && (
                        <Button
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleJoinStream();
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Play className="w-4 h-4 mr-1" />
                            Watch Live
                        </Button>
                    )}
                    {stream.status === 'SCHEDULED' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                        >
                            <Clock className="w-4 h-4 mr-1" />
                            Remind Me
                        </Button>
                    )}
                    {stream.status === 'ENDED' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleJoinStream();
                            }}
                            className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
                        >
                            <Play className="w-4 h-4 mr-1" />
                            Watch Replay
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Skeleton loader for loading states
export function StreamCardSkeleton() {
    return (
        <Card className="animate-pulse bg-gray-800 border-gray-700 rounded-lg overflow-hidden">
            <div className="w-full h-48 sm:h-52 md:h-56 lg:h-60 bg-gray-700" />
            <CardContent className="p-4">
                <div className="h-6 bg-gray-700 rounded mb-2 w-3/4" />
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full" />
                    <div>
                        <div className="h-4 bg-gray-700 rounded w-24 mb-1" />
                        <div className="h-3 bg-gray-700 rounded w-16" />
                    </div>
                </div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-full" />
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-3" />
                <div className="h-8 bg-gray-700 rounded w-28" />
            </CardContent>
        </Card>
    );
}
