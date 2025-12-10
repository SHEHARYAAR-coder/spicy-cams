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
    Clock,
    SwitchCamera,
    Wallet,
    AlertTriangle,
    DollarSign
} from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";



interface ViewerPlayerProps {
    streamId: string;
    token: string;
    serverUrl: string;
    streamTitle?: string;
    modelName?: string;
    className?: string;
}

export function ViewerPlayer({
    streamId,
    token,
    serverUrl,
    streamTitle,
    modelName,
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
                    modelName={modelName}
                />
                <RoomAudioRenderer />
            </LiveKitRoom>
        </div>
    );
}

interface ViewerVideoViewProps {
    streamId: string;
    streamTitle?: string;
    modelName?: string;
}

function LiveViewerStats({ streamTitle, modelName, startTime, isPaused }: {
    streamTitle?: string;
    modelName?: string;
    startTime?: Date;
    isPaused?: boolean;
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
                <div className={`flex items-center space-x-2 ${isPaused ? 'text-yellow-500' : 'text-red-500'}`}>
                    <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className="font-semibold">{isPaused ? 'PAUSED' : 'LIVE'}</span>
                </div>
                {streamTitle && (
                    <span className="font-medium truncate max-w-xs">{streamTitle}</span>
                )}
                {modelName && (
                    <span className="text-gray-300 truncate">by {modelName}</span>
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

function ViewerVideoView({ streamId, streamTitle, modelName }: ViewerVideoViewProps) {
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
    const [selectedView, setSelectedView] = useState<'camera' | 'screen'>('camera');
    const [videoContainerRef, setVideoContainerRef] = useState<HTMLDivElement | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);
    const [billingError, setBillingError] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);

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
                text: `Watch ${modelName || 'this'} live stream!`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const toggleFullscreen = () => {
        const container = videoContainerRef;
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen();
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

    // Check if stream is paused
    useEffect(() => {
        const checkPauseState = async () => {
            try {
                const response = await fetch(`/api/streams/${streamId}/pause`);
                if (response.ok) {
                    const data = await response.json();
                    setIsPaused(data.paused);
                }
            } catch (error) {
                console.error('Failed to check pause state:', error);
            }
        };

        checkPauseState();
        // Check every 3 seconds for pause state updates
        const interval = setInterval(checkPauseState, 3000);
        return () => clearInterval(interval);
    }, [streamId]);

    // Billing mechanism - charge every 60 seconds
    useEffect(() => {
        // Only bill if connected to stream and stream is not paused
        if (connectionState !== ConnectionState.Connected || isPaused) {
            return;
        }

        // Function to process billing
        const processBilling = async () => {
            try {
                const response = await fetch(`/api/streams/${streamId}/bill`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        watchTimeSeconds: 60, // Bill for 1 minute
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.charged) {
                        // Update balance display
                        setBalance(parseFloat(data.remainingBalance));

                        // Show warning if balance is low (less than 10 tokens)
                        if (parseFloat(data.remainingBalance) < 10) {
                            setShowLowBalanceWarning(true);
                        }

                        console.log(`✅ Billed ${data.tokensCharged} tokens for ${data.watchTimeSeconds}s viewing (Model earned: $${data.modelEarned})`);
                    }
                    setBillingError(null);
                } else if (response.status === 402) {
                    // Insufficient funds
                    setBillingError('Insufficient balance. Please add credits to continue watching.');
                    setShowLowBalanceWarning(true);

                    // Optionally, you could disconnect the user here
                    // For now, we'll just show the error
                } else {
                    console.error('Billing error:', data.error);
                    setBillingError(data.error);
                }
            } catch (error) {
                console.error('Failed to process billing:', error);
                setBillingError('Failed to process payment');
            }
        };

        // Initial billing after 60 seconds
        const initialTimer = setTimeout(processBilling, 60000);

        // Then bill every 60 seconds
        const interval = setInterval(processBilling, 60000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [streamId, connectionState, isPaused]);

    // Fetch initial balance
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await fetch('/api/wallet/balance');
                if (response.ok) {
                    const data = await response.json();
                    setBalance(parseFloat(data.balance));
                }
            } catch (error) {
                console.error('Failed to fetch balance:', error);
            }
        };

        fetchBalance();
    }, []);

    const videoTrack = tracks.find(
        (trackRef) => trackRef.source === Track.Source.Camera && trackRef.publication?.kind === 'video'
    );

    const screenTrack = tracks.find(
        (trackRef) => trackRef.source === Track.Source.ScreenShare && trackRef.publication?.kind === 'video'
    );

    // Prioritize screen share over camera, or use selected view
    let displayTrack = videoTrack;

    if (screenTrack && videoTrack) {
        // Both available - use selected view
        displayTrack = selectedView === 'screen' ? screenTrack : videoTrack;
    } else if (screenTrack) {
        // Only screen available
        displayTrack = screenTrack;
    } else if (videoTrack) {
        // Only camera available
        displayTrack = videoTrack;
    }

    const activeParticipants = participants.filter(p => p.isLocal === false);

    // Auto-select view when tracks change
    useEffect(() => {
        if (screenTrack && !videoTrack) {
            setSelectedView('screen');
        } else if (videoTrack && !screenTrack) {
            setSelectedView('camera');
        }
    }, [screenTrack, videoTrack]);

    // Debug logging for viewer
    useEffect(() => {
        console.log('👀 Viewer - Connection State:', connectionState);
        console.log('👀 Viewer - Tracks:', tracks.length);
        console.log('👀 Viewer - Participants:', participants.length);
        console.log('👀 Viewer - Display Track:', displayTrack ? 'Available' : 'None');
    }, [connectionState, tracks, participants, displayTrack]);

    return (
        <div
            ref={setVideoContainerRef}
            className={`relative w-full bg-black rounded-lg overflow-hidden ${isFullscreen ? 'h-full' : 'h-full'
                }`}
        >
            {/* Top Stats Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4">
                <LiveViewerStats
                    streamTitle={streamTitle}
                    modelName={modelName}
                    startTime={new Date()}
                    isPaused={isPaused}
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

                {/* Balance Display */}
                {balance !== null && (
                    <div className={`backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center ${balance < 10 ? 'bg-red-500/90' : balance < 50 ? 'bg-yellow-500/90' : 'bg-purple-500/90'
                        }`}>
                        <Wallet className="w-4 h-4 mr-1" />
                        {balance.toFixed(0)} tokens
                    </div>
                )}
            </div>

            {/* Low Balance Warning */}
            {showLowBalanceWarning && balance !== null && balance < 10 && (
                <div className="absolute top-28 left-4 right-4 z-30 mx-auto max-w-md">
                    <div className="bg-yellow-500/95 backdrop-blur-sm text-black px-4 py-3 rounded-lg shadow-lg border-2 border-yellow-400">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-sm">Low Balance Warning</p>
                                <p className="text-xs mt-1">
                                    Your balance is running low ({balance.toFixed(0)} tokens).
                                    Add credits to continue watching without interruption.
                                    <br />
                                    <span className="font-semibold mt-1 inline-block">Rate: 5 tokens per minute</span>
                                </p>
                                <button
                                    onClick={() => window.location.href = '/pricing'}
                                    className="mt-2 bg-black text-yellow-400 px-3 py-1 rounded text-xs font-medium hover:bg-gray-900"
                                >
                                    Add Credits
                                </button>
                                <button
                                    onClick={() => setShowLowBalanceWarning(false)}
                                    className="ml-2 text-xs underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Billing Error Alert */}
            {billingError && (
                <div className="absolute top-28 left-4 right-4 z-30 mx-auto max-w-md">
                    <div className="bg-red-500/95 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg border-2 border-red-400">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-sm">Payment Error</p>
                                <p className="text-xs mt-1">{billingError}</p>
                                <button
                                    onClick={() => window.location.href = '/pricing'}
                                    className="mt-2 bg-white text-red-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100"
                                >
                                    Add Credits Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Like Animation */}
            {showLike && (
                <div className="absolute top-1/2 right-8 z-30 pointer-events-none">
                    <div className="animate-bounce">
                        <Heart className="w-12 h-12 text-red-500 fill-current" />
                    </div>
                </div>
            )}

            {/* Stream Paused Overlay */}
            {isPaused && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-25 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-yellow-600 animate-pulse">
                            <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold mb-3">Stream Paused</h3>
                        <p className="text-gray-300 text-sm sm:text-lg mb-4 max-w-md mx-auto">
                            {modelName || 'The broadcaster'} has temporarily paused the stream.
                        </p>
                        <p className="text-yellow-500 text-sm sm:text-base font-semibold mb-6">
                            Please wait, the stream will resume shortly...
                        </p>
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            <span>You'll continue watching when the stream resumes</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Video Display */}
            <div className="w-full h-full relative flex items-center justify-center">{displayTrack && displayTrack.publication?.isSubscribed ? (
                    <>
                        <VideoTrack
                            trackRef={displayTrack}
                            className="w-full h-full object-contain"
                        />

                        {/* Track Type Indicator - Repositioned to bottom left */}
                        <div className="absolute bottom-20 left-4 z-10">
                            <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center">
                                {screenTrack && displayTrack === screenTrack ? (
                                    <>
                                        <Monitor className="w-3.5 h-3.5 mr-1.5" />
                                        Screen Share
                                    </>
                                ) : (
                                    <>
                                        <Video className="w-3.5 h-3.5 mr-1.5" />
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
                                    : `${modelName || 'The broadcaster'} will be with you shortly`}
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
                        {/* View Switcher - Only show if both camera and screen are available */}
                        {videoTrack && screenTrack && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-white hover:bg-white/20 h-10 px-4 backdrop-blur-sm border border-white/10"
                                    >
                                        <SwitchCamera className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-900 border-gray-700 text-white">
                                    <DropdownMenuItem
                                        onClick={() => setSelectedView('camera')}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                                    >
                                        <Video className={`w-4 h-4 ${selectedView === 'camera' ? 'text-blue-400' : 'text-gray-400'}`} />
                                        <span>Camera View</span>
                                        {selectedView === 'camera' && <span className="ml-auto text-xs text-blue-400">✓</span>}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-gray-700" />
                                    <DropdownMenuItem
                                        onClick={() => setSelectedView('screen')}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                                    >
                                        <Monitor className={`w-4 h-4 ${selectedView === 'screen' ? 'text-blue-400' : 'text-gray-400'}`} />
                                        <span>Screen Share</span>
                                        {selectedView === 'screen' && <span className="ml-auto text-xs text-blue-400">✓</span>}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

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