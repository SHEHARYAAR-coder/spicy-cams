"use client";

import { useState } from "react";
import { StreamStatus } from "@prisma/client";
import {
    Video,
    Calendar,
    Clock,
    Users,
    MessageSquare,
    Eye,
    Play,
    Square,
    Edit,
    Trash2,
    MoreVertical,
    Plus,
    Filter,
    Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface Stream {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    tags: string[];
    status: StreamStatus;
    thumbnailUrl: string | null;
    livekitRoomName: string | null;
    recordingEnabled: boolean;
    recordingUrl: string | null;
    scheduledAt: string | null;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    updatedAt: string;
    totalSessions: number;
    totalMessages: number;
    activeSessions: number;
    totalWatchTimeMs: number;
}

interface MyStreamsContentProps {
    streams: Stream[];
}

export function MyStreamsContent({ streams }: MyStreamsContentProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // Filter streams
    const filteredStreams = streams.filter((stream) => {
        const matchesSearch =
            stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stream.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stream.category?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === "ALL" || stream.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Calculate statistics
    const stats = {
        total: streams.length,
        live: streams.filter((s) => s.status === "LIVE").length,
        scheduled: streams.filter((s) => s.status === "SCHEDULED").length,
        ended: streams.filter((s) => s.status === "ENDED").length,
        totalViews: streams.reduce((sum, s) => sum + s.totalSessions, 0),
        totalMessages: streams.reduce((sum, s) => sum + s.totalMessages, 0),
    };

    const getStatusBadge = (status: StreamStatus) => {
        switch (status) {
            case "LIVE":
                return (
                    <Badge className="bg-red-600 hover:bg-red-700 text-white">
                        <div className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse" />
                        Live
                    </Badge>
                );
            case "SCHEDULED":
                return (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                        Scheduled
                    </Badge>
                );
            case "ENDED":
                return (
                    <Badge className="bg-gray-600 hover:bg-gray-700 text-white">
                        Ended
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-600 hover:bg-gray-700 text-white">
                        {status}
                    </Badge>
                );
        }
    };

    const formatDuration = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    return (
        <div className="space-y-6 min-h-screen">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">
                            Total Streams
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            Live Now
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{stats.live}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">
                            Scheduled
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-400">
                            {stats.scheduled}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">
                            Ended
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-400">
                            {stats.ended}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">
                            Total Views
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-400">
                            {stats.totalViews}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">
                            Messages
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-400">
                            {stats.totalMessages}
                        </div>
                    </CardContent>
                </Card>
            </div>            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-1 gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search streams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500/50 backdrop-blur-sm"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] bg-gray-800/50 border-gray-700 text-white focus:border-purple-500/50 backdrop-blur-sm">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="LIVE">Live</SelectItem>
                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                            <SelectItem value="ENDED">Ended</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Link href="/model/streams/new">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Stream
                    </Button>
                </Link>
            </div>

            {/* Streams Grid */}
            {filteredStreams.length === 0 ? (
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                {searchQuery || statusFilter !== "ALL"
                                    ? "No streams found"
                                    : "No streams yet"}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {searchQuery || statusFilter !== "ALL"
                                    ? "Try adjusting your filters"
                                    : "Create your first stream to get started"}
                            </p>
                            {!searchQuery && statusFilter === "ALL" && (
                                <Link href="/model/streams/new">
                                    <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Your First Stream
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredStreams.map((stream) => (
                        <Card
                            key={stream.id}
                            className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 backdrop-blur-sm transition-all duration-300 overflow-hidden group hover:shadow-lg hover:shadow-purple-500/10"
                        >
                            {/* Thumbnail */}
                            <div className="relative h-48 bg-gray-900 overflow-hidden">
                                {stream.thumbnailUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={stream.thumbnailUrl}
                                        alt={stream.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Video className="w-16 h-16 text-gray-700" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3">
                                    {getStatusBadge(stream.status)}
                                </div>
                                {stream.status === "LIVE" && (
                                    <div className="absolute top-3 right-3">
                                        <Badge className="bg-black/70 text-white flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {stream.activeSessions}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-4">
                                {/* Title and Actions */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-white truncate mb-1">
                                            {stream.title}
                                        </h3>
                                        {stream.category && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs border-gray-600 text-gray-400"
                                            >
                                                {stream.category}
                                            </Badge>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-400 hover:text-white"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Play className="w-4 h-4 mr-2" />
                                                View
                                            </DropdownMenuItem>
                                            {stream.status === "SCHEDULED" && (
                                                <DropdownMenuItem>
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Start Stream
                                                </DropdownMenuItem>
                                            )}
                                            {stream.status === "LIVE" && (
                                                <DropdownMenuItem className="text-red-500">
                                                    <Square className="w-4 h-4 mr-2" />
                                                    End Stream
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem className="text-red-500">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Description */}
                                {stream.description && (
                                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                        {stream.description}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="bg-gray-900/50 rounded-lg p-2">
                                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                                            <Users className="w-3 h-3" />
                                            <span className="text-xs">Views</span>
                                        </div>
                                        <div className="text-sm font-semibold text-white">
                                            {stream.totalSessions}
                                        </div>
                                    </div>
                                    <div className="bg-gray-900/50 rounded-lg p-2">
                                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                                            <MessageSquare className="w-3 h-3" />
                                            <span className="text-xs">Msgs</span>
                                        </div>
                                        <div className="text-sm font-semibold text-white">
                                            {stream.totalMessages}
                                        </div>
                                    </div>
                                    <div className="bg-gray-900/50 rounded-lg p-2">
                                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-xs">Time</span>
                                        </div>
                                        <div className="text-sm font-semibold text-white">
                                            {formatDuration(stream.totalWatchTimeMs)}
                                        </div>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="space-y-1 text-xs text-gray-500">
                                    {stream.scheduledAt && stream.status === "SCHEDULED" && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>Scheduled: {formatDate(stream.scheduledAt)}</span>
                                        </div>
                                    )}
                                    {stream.startedAt && (
                                        <div className="flex items-center gap-1">
                                            <Play className="w-3 h-3" />
                                            <span>Started: {formatDate(stream.startedAt)}</span>
                                        </div>
                                    )}
                                    {stream.endedAt && (
                                        <div className="flex items-center gap-1">
                                            <Square className="w-3 h-3" />
                                            <span>Ended: {formatDate(stream.endedAt)}</span>
                                        </div>
                                    )}
                                    {!stream.scheduledAt && !stream.startedAt && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>Created: {formatDate(stream.createdAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
