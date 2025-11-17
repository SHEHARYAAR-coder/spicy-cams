"use client";

import { useState, useEffect } from 'react';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useTracks,
    useParticipants,
    VideoTrack,
    useConnectionState,
    AudioTrack
} from '@livekit/components-react';
import {
    ConnectionState,
    Track
} from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Loader2,
    Wifi,
    WifiOff,
    Play,
    Users,
    Eye,
    Heart,
    Share2,
    Settings,
    Monitor,
    Video,
    Clock
} from 'lucide-react';

interface ViewerPlayerProps {
    streamId: string;
    token: string;
    serverUrl: string;
    streamTitle?: string;
    creatorName?: string;
    className?: string;
}

export function ViewerPlayer({
    streamId,
    token,
    serverUrl,
    streamTitle,
    creatorName,
    className = ""
}: ViewerPlayerProps) {
    return (
        <div className={`relative ${className}`}>
            <LiveKitRoom
                token={token}
                serverUrl={serverUrl}
                connectOptions={{
                    autoSubscribe: true, // Viewer should subscribe to all tracks
                }}
                options={{
                    adaptiveStream: true,
                    dynacast: true,
                }}
                className="w-full h-full min-h-[300px] rounded-lg border bg-black"
            >
                <ViewerVideoView
                    streamId={streamId}
                    streamTitle={streamTitle}
                    creatorName={creatorName}
                />
                <RoomAudioRenderer />
            </LiveKitRoom>
        </div>
    );
}

interface ViewerVideoViewProps {
    streamId: string;
    streamTitle?: string;
    creatorName?: string;
}

function LiveViewerStats({ streamTitle, creatorName, startTime }: {
    streamTitle?: string;
    creatorName?: string;
    startTime?: Date;
}) {
    const [viewDuration, setViewDuration] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setViewDuration(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center justify-between w-full text-white">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-semibold text-red-500">LIVE</span>
                </div>
                {streamTitle && (
                    <span className="font-medium truncate max-w-xs">{streamTitle}</span>
                )}
                {creatorName && (
                    <span className="text-gray-300 truncate">by {creatorName}</span>
                )}
            </div>

            <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(viewDuration)}</span>
                </div>
            </div>
        </div>
    );
}

function ViewerVideoView({ streamId, streamTitle, creatorName }: ViewerVideoViewProps) {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false },
    );

    const connectionState = useConnectionState();
    const participants = useParticipants();

    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showLike, setShowLike] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const toggleAudio = () => {
        setIsAudioMuted(!isAudioMuted);
    };

    const sendLike = () => {
        setShowLike(true);
        setLikeCount(prev => prev + 1);
        setTimeout(() => setShowLike(false), 1000);
    };

    const shareStream = () => {
        if (navigator.share) {
            navigator.share({
                title: streamTitle || 'Live Stream',
                text: `Watch ${creatorName || 'this'} live stream!`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const videoTrack = tracks.find(
        (trackRef) => trackRef.source === Track.Source.Camera && trackRef.publication?.kind === 'video'
    );

    const screenTrack = tracks.find(
        (trackRef) => trackRef.source === Track.Source.ScreenShare && trackRef.publication?.kind === 'video'
    );

    // Prioritize screen share over camera
    const displayTrack = screenTrack || videoTrack;
    const activeParticipants = participants.filter(p => p.isLocal === false);

    // Debug logging for viewer
    useEffect(() => {
        console.log('👀 Viewer - Connection State:', connectionState);
        console.log('👀 Viewer - Tracks:', tracks.length);
        console.log('👀 Viewer - Participants:', participants.length);
        console.log('👀 Viewer - Display Track:', displayTrack ? 'Available' : 'None');
    }, [connectionState, tracks, participants, displayTrack]);

    return (
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
            {/* Top Stats Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4">
                <LiveViewerStats
                    streamTitle={streamTitle}
                    creatorName={creatorName}
                    startTime={new Date()}
                />
            </div>

            {/* Connection Status */}
            <div className="absolute top-16 left-4 z-10 flex items-center space-x-2">
                {connectionState === ConnectionState.Connected ? (
                    <div className="flex items-center bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                        <Wifi className="w-4 h-4 mr-2" />
                        HD
                    </div>
                ) : (
                    <div className="flex items-center bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                        <WifiOff className="w-4 h-4 mr-2" />
                        {connectionState === ConnectionState.Connecting ? 'Connecting...' : 'Offline'}
                    </div>
                )}

                {activeParticipants.length > 0 && (
                    <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {activeParticipants.length + 1}
                    </div>
                )}
            </div>

            {/* Like Animation */}
            {showLike && (
                <div className="absolute top-1/2 right-8 z-30 pointer-events-none">
                    <div className="animate-bounce">
                        <Heart className="w-12 h-12 text-red-500 fill-current" />
                    </div>
                </div>
            )}

            {/* Main Video Display */}
            <div className="w-full h-full relative">
                {displayTrack && displayTrack.publication?.isSubscribed ? (
                    <>
                        <VideoTrack
                            trackRef={displayTrack}
                            className="w-full h-full object-cover"
                        />

                        {/* Track Type Indicator */}
                        <div className="absolute top-20 right-4 z-10">
                            <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                                {screenTrack ? (
                                    <>
                                        <Monitor className="w-3 h-3 mr-1" />
                                        Screen
                                    </>
                                ) : (
                                    <>
                                        <Video className="w-3 h-3 mr-1" />
                                        Camera
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
                        <div className="text-center text-gray-400">
                            <div className="w-32 h-32 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-700">
                                {connectionState === ConnectionState.Connecting ? (
                                    <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
                                ) : (
                                    <Play className="w-16 h-16 text-gray-500" />
                                )}
                            </div>
                            <p className="text-xl font-semibold mb-2">
                                {connectionState === ConnectionState.Connecting
                                    ? 'Connecting to stream...'
                                    : 'Stream will start soon'}
                            </p>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                {connectionState === ConnectionState.Connecting
                                    ? 'Please wait while we connect you to the live stream'
                                    : `${creatorName || 'The broadcaster'} will be with you shortly`}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Professional Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                <div className="flex items-center justify-between">
                    {/* Left Controls */}
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleAudio}
                            className="text-white hover:bg-white/20 h-10 px-4 backdrop-blur-sm border border-white/10"
                        >
                            {isAudioMuted ? (
                                <VolumeX className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={sendLike}
                            className="text-white hover:bg-red-500/20 h-10 px-4 backdrop-blur-sm border border-white/10"
                        >
                            <Heart className={`w-5 h-5 ${likeCount > 0 ? 'fill-current text-red-500' : ''}`} />
                            {likeCount > 0 && <span className="ml-1 text-xs">{likeCount}</span>}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={shareStream}
                            className="text-white hover:bg-blue-500/20 h-10 px-4 backdrop-blur-sm border border-white/10"
                        >
                            <Share2 className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20 h-10 px-4 backdrop-blur-sm border border-white/10"
                        >
                            <Settings className="w-5 h-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleFullscreen}
                            className="text-white hover:bg-white/20 h-10 px-4 backdrop-blur-sm border border-white/10"
                        >
                            {isFullscreen ? (
                                <Minimize className="w-5 h-5" />
                            ) : (
                                <Maximize className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}