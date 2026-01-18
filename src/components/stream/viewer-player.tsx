"use client";

import { useState, useEffect, useRef } from 'react';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useTracks,
    useParticipants,
    VideoTrack,
    useConnectionState,
    useRoomContext
} from '@livekit/components-react';
import {
    ConnectionState,
    Track,
    RoomEvent,
    DisconnectReason
} from 'livekit-client';
import { Button } from '@/components/ui/button';
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
    Heart,
    Share2,
    Settings,
    Monitor,
    Video,
    Clock,
    SwitchCamera,
    Wallet,
    AlertTriangle,
    PhoneOff
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TipDialog } from "./tip-dialog";



interface ViewerPlayerProps {
    streamId: string;
    token: string;
    serverUrl: string;
    streamTitle?: string;
    modelName?: string;
    modelId?: string;
    className?: string;
    onSendTip?: (tokens: number, activity?: string) => void;
    onPrivateShow?: (minutes: number) => void;
    onLike?: () => void;
    onStreamEnd?: () => void;
    likeCount?: number;
    privateShowPrice?: number;
}

export function ViewerPlayer({
    streamId,
    token,
    serverUrl,
    streamTitle,
    modelName,
    modelId,
    className = "",
    onSendTip,
    onPrivateShow,
    onLike,
    onStreamEnd,
    likeCount = 0,
    privateShowPrice = 90,
}: ViewerPlayerProps) {
    // Debug: Log connection parameters
    useEffect(() => {
        console.log('🎬 ViewerPlayer mounting with:', {
            streamId,
            hasToken: !!token,
            tokenLength: token?.length,
            serverUrl,
            serverUrlValid: serverUrl?.startsWith('wss://') || serverUrl?.startsWith('ws://'),
        });

        if (!serverUrl) {
            console.error('❌ ViewerPlayer: No serverUrl provided!');
        }
        if (!token) {
            console.error('❌ ViewerPlayer: No token provided!');
        }
    }, [streamId, token, serverUrl]);

    // Handle connection errors
    const handleError = (error: Error) => {
        console.error('❌ LiveKit Room Error:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
        });
    };

    // Handle connection state changes
    const handleConnected = () => {
        console.log('✅ LiveKit Room Connected successfully');
    };

    const handleDisconnected = () => {
        console.log('🔴 LiveKit Room Disconnected');
    };

    // Show error if no serverUrl
    if (!serverUrl || !token) {
        return (
            <div className={`relative ${className} bg-black flex items-center justify-center min-h-[300px]`}>
                <div className="text-center text-white p-4">
                    <p className="text-red-500 font-semibold mb-2">Connection Error</p>
                    <p className="text-sm text-gray-400">
                        {!serverUrl ? 'LiveKit server URL not configured' : 'No access token available'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        Please refresh the page or contact support.
                    </p>
                </div>
            </div>
        );
    }

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
                onError={handleError}
                onConnected={handleConnected}
                onDisconnected={handleDisconnected}
                className="w-full h-full min-h-[300px] rounded-lg border bg-black"
            >
                <ViewerVideoView
                    streamId={streamId}
                    streamTitle={streamTitle}
                    modelName={modelName}
                    modelId={modelId}
                    onSendTip={onSendTip}
                    onPrivateShow={onPrivateShow}
                    onLike={onLike}
                    onStreamEnd={onStreamEnd}
                    likeCount={likeCount}
                    privateShowPrice={privateShowPrice}
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
    modelId?: string;
    onSendTip?: (tokens: number, activity?: string) => void;
    onPrivateShow?: (minutes: number) => void;
    onLike?: () => void;
    onStreamEnd?: () => void;
    likeCount?: number;
    privateShowPrice?: number;
}

function LiveViewerStats({ streamTitle, modelName, startTime: _startTime, isPaused }: {
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

function ViewerVideoView({
    streamId,
    streamTitle,
    modelName,
    modelId,
    onSendTip,
    onPrivateShow,
    onLike,
    onStreamEnd,
    likeCount: propLikeCount = 0,
    privateShowPrice = 90,
}: ViewerVideoViewProps) {
    const room = useRoomContext();
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false },
    );

    // Force subscribe to all remote tracks when room connects
    useEffect(() => {
        if (!room) return;

        const subscribeToTracks = () => {
            room.remoteParticipants.forEach((participant) => {
                participant.trackPublications.forEach((publication) => {
                    if (publication.kind === 'video' && !publication.isSubscribed) {
                        console.log('🔄 Force subscribing to track:', publication.trackSid);
                        publication.setSubscribed(true);
                    }
                });
            });
        };

        // Subscribe when connected
        subscribeToTracks();

        // Also subscribe when new tracks are published
        const handleTrackPublished = () => {
            console.log('📡 New track published, subscribing...');
            setTimeout(subscribeToTracks, 100);
        };

        room.on(RoomEvent.TrackPublished, handleTrackPublished);
        room.on(RoomEvent.ParticipantConnected, subscribeToTracks);

        return () => {
            room.off(RoomEvent.TrackPublished, handleTrackPublished);
            room.off(RoomEvent.ParticipantConnected, subscribeToTracks);
        };
    }, [room]);

    const connectionState = useConnectionState();
    const participants = useParticipants();
    const cleanupRef = useRef(false);
    const onStreamEndRef = useRef(onStreamEnd);

    // Keep the ref updated
    useEffect(() => {
        onStreamEndRef.current = onStreamEnd;
    }, [onStreamEnd]);

    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showLike, setShowLike] = useState(false);
    const [selectedView, setSelectedView] = useState<'camera' | 'screen'>('camera');
    const [videoContainerRef, setVideoContainerRef] = useState<HTMLDivElement | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);
    const [billingError, setBillingError] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [hasAttemptedBilling, setHasAttemptedBilling] = useState(false);
    const [showTipDialog, setShowTipDialog] = useState(false);
    const [streamEnded, setStreamEnded] = useState(false);
    const [showStreamEndedMessage, setShowStreamEndedMessage] = useState(false);

    const toggleAudio = () => {
        setIsAudioMuted(!isAudioMuted);
    };

    const handleOpenTipDialog = () => {
        setShowTipDialog(true);
    };

    const handleTip = (tokens: number, activity?: string) => {
        onSendTip?.(tokens, activity);
        setShowTipDialog(false);
    };

    const handleLike = () => {
        setShowLike(true);
        setTimeout(() => setShowLike(false), 1000);
        onLike?.();
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

    // Check if stream is paused or ended
    useEffect(() => {
        const checkStreamState = async () => {
            try {
                // Check pause state
                const pauseResponse = await fetch(`/api/streams/${streamId}/pause`);
                if (pauseResponse.ok) {
                    const data = await pauseResponse.json();
                    setIsPaused(data.paused);
                }

                // Check if stream has ended
                const streamResponse = await fetch(`/api/streams/${streamId}`);
                if (streamResponse.ok) {
                    const streamData = await streamResponse.json();
                    if (streamData.stream.status === 'ENDED') {
                        console.log('🔴 Stream has ended - detected by polling');
                        setStreamEnded(true);
                        setShowStreamEndedMessage(true);
                        onStreamEndRef.current?.();
                    }
                } else if (streamResponse.status === 404) {
                    // Stream not found - it was deleted
                    console.log('🔴 Stream not found - was deleted');
                    setStreamEnded(true);
                    setShowStreamEndedMessage(true);
                    onStreamEndRef.current?.();
                }
            } catch (error) {
                console.error('Failed to check stream state:', error);
            }
        };

        checkStreamState();
        // Check every 10 seconds for stream status
        const interval = setInterval(checkStreamState, 10000);
        return () => clearInterval(interval);
    }, [streamId]);

    // Listen for room disconnection and participant events
    useEffect(() => {
        if (!room) return;

        const handleDisconnected = (reason?: DisconnectReason) => {
            console.log('🔴 Room disconnected, reason:', reason);
            // If room was deleted or closed by host, mark stream as ended
            if (reason === DisconnectReason.ROOM_DELETED || reason === DisconnectReason.STATE_MISMATCH) {
                console.log('🔴 Stream ended - room deleted or closed');
                setStreamEnded(true);
                setShowStreamEndedMessage(true);
                onStreamEndRef.current?.();
            }
        };

        const handleParticipantDisconnected = (participant: { identity: string; isLocal: boolean }) => {
            // Check if the broadcaster/host left
            // The host is typically the first non-local participant or has specific identity
            if (!participant.isLocal) {
                console.log('👋 Participant disconnected:', participant.identity);

                // Check if all non-local participants have left (meaning the broadcaster left)
                setTimeout(() => {
                    const remainingParticipants = room.remoteParticipants;
                    if (remainingParticipants.size === 0) {
                        console.log('🔴 All broadcasters have left - stream likely ended');
                        setStreamEnded(true);
                        setShowStreamEndedMessage(true);
                        onStreamEndRef.current?.();
                    }
                }, 1000); // Small delay to ensure participant list updates
            }
        };

        // Register event listeners
        room.on(RoomEvent.Disconnected, handleDisconnected);
        room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

        return () => {
            room.off(RoomEvent.Disconnected, handleDisconnected);
            room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        };
    }, [room]);

    // Billing mechanism - charge every 60 seconds
    useEffect(() => {
        // Only bill if connected to stream, stream is not paused, and stream hasn't ended
        if (connectionState !== ConnectionState.Connected || isPaused || streamEnded) {
            return;
        }

        // Function to process billing
        const processBilling = async () => {
            setHasAttemptedBilling(true);
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
                } else {
                    console.error('Billing error:', data.error);
                    setBillingError(data.error || null);
                }
            } catch (error) {
                console.error('Failed to process billing:', error);
                // Only show error if we've actually tried billing, not on initial load
                setBillingError('Failed to process payment. Retrying...');
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
    }, [streamId, connectionState, isPaused, streamEnded]);

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

    // Find video tracks - be more lenient with detection for production
    // First try to find tracks with actual track object, then fall back to subscribed publications
    const videoTrack = tracks.find(
        (trackRef) =>
            trackRef.source === Track.Source.Camera &&
            trackRef.publication &&
            (trackRef.publication.track || trackRef.publication.isSubscribed)
    ) || tracks.find(
        (trackRef) =>
            trackRef.source === Track.Source.Camera &&
            trackRef.publication &&
            trackRef.publication.kind === 'video'
    );

    const screenTrack = tracks.find(
        (trackRef) =>
            trackRef.source === Track.Source.ScreenShare &&
            trackRef.publication &&
            (trackRef.publication.track || trackRef.publication.isSubscribed)
    ) || tracks.find(
        (trackRef) =>
            trackRef.source === Track.Source.ScreenShare &&
            trackRef.publication &&
            trackRef.publication.kind === 'video'
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
        console.log('👀 Viewer - All Tracks:', tracks.map(t => ({
            source: t.source,
            hasPublication: !!t.publication,
            hasTrack: !!t.publication?.track,
            isSubscribed: t.publication?.isSubscribed,
            kind: t.publication?.kind
        })));
        console.log('👀 Viewer - Participants:', participants.length, participants.map(p => ({ identity: p.identity, isLocal: p.isLocal })));
        console.log('👀 Viewer - Video Track:', videoTrack ? 'Found' : 'None');
        console.log('👀 Viewer - Display Track:', displayTrack ? 'Available' : 'None');
    }, [connectionState, tracks, participants, displayTrack, videoTrack]);

    // Cleanup tracks on unmount
    useEffect(() => {
        return () => {
            if (cleanupRef.current) return;
            cleanupRef.current = true;

            console.log('🧹 Cleaning up viewer component...');

            // Stop all subscribed tracks
            tracks.forEach(track => {
                if (track.publication?.track) {
                    track.publication.track.stop();
                }
            });

            // Disconnect from room
            if (room) {
                room.disconnect();
            }
        };
    }, [tracks, room]);

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

            {/* Billing Error Alert - Only show after billing has been attempted */}
            {billingError && hasAttemptedBilling && (
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

            {/* Stream Ended Overlay */}
            {showStreamEndedMessage && (
                <div className="absolute inset-0 bg-black/95 backdrop-blur-lg z-30 flex items-center justify-center">
                    <div className="text-center text-white px-4 max-w-lg">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-600">
                            <PhoneOff className="w-12 h-12 sm:w-16 sm:h-16 text-red-500" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold mb-3">Stream Has Ended</h3>
                        <p className="text-gray-300 text-sm sm:text-lg mb-6 max-w-md mx-auto">
                            {modelName || 'The broadcaster'} has ended this stream.
                            <br />
                            Thank you for watching!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => window.location.href = '/streaming'}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg"
                            >
                                Browse Live Streams
                            </button>
                            <button
                                onClick={() => window.location.href = `/m/${modelId}`}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                            >
                                View Model Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stream Paused Overlay - Shows last frame with blur */}
            {isPaused && (
                <div className="absolute inset-0 z-25">
                    {/* Blurred background using the video element */}
                    <div className="absolute inset-0 backdrop-blur-xl bg-black/40" />

                    {/* Content overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white px-4 z-30">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-yellow-600 animate-pulse">
                                <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500" />
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-bold mb-3">Stream Paused</h3>
                            <p className="text-gray-200 text-sm sm:text-base mb-6 max-w-md mx-auto">
                                {modelName || 'The broadcaster'} has temporarily paused the stream.
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 items-center justify-center max-w-xs mx-auto">
                                <Button
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-semibold shadow-lg transition-all duration-200 hover:scale-105"
                                    onClick={() => {
                                        // TODO: Implement notification feature
                                        alert('Notification feature coming soon!');
                                    }}
                                >
                                    Notify when live
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold backdrop-blur-sm transition-all duration-200 hover:scale-105"
                                    onClick={() => {
                                        // TODO: Implement tip feature
                                        alert('Tip feature coming soon!');
                                    }}
                                >
                                    Send Tip
                                </Button>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-gray-300 text-xs sm:text-sm mt-6">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                <span>You&apos;ll continue watching when the stream resumes</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Video Display */}
            <div className="w-full h-full relative flex items-center justify-center">{displayTrack && displayTrack.publication && (displayTrack.publication.track || displayTrack.publication.isSubscribed) ? (
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
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
                {/* Secondary Controls Row */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-2">
                    {/* Left - Volume & Share */}
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleAudio}
                            className="text-white hover:bg-white/20 h-9 w-9 p-0 backdrop-blur-sm border border-white/10 rounded-full"
                        >
                            {isAudioMuted ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={shareStream}
                            className="text-white hover:bg-blue-500/20 h-9 w-9 p-0 backdrop-blur-sm border border-white/10 rounded-full"
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Right - View Switcher, Settings, Fullscreen */}
                    <div className="flex items-center space-x-2">
                        {/* View Switcher - Only show if both camera and screen are available */}
                        {videoTrack && screenTrack && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-white hover:bg-white/20 h-9 w-9 p-0 backdrop-blur-sm border border-white/10 rounded-full"
                                    >
                                        <SwitchCamera className="w-4 h-4" />
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
                            className="text-white hover:bg-white/20 h-9 w-9 p-0 backdrop-blur-sm border border-white/10 rounded-full"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleFullscreen}
                            className="text-white hover:bg-white/20 h-9 w-9 p-0 backdrop-blur-sm border border-white/10 rounded-full"
                        >
                            {isFullscreen ? (
                                <Minimize className="w-4 h-4" />
                            ) : (
                                <Maximize className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Main Action Bar Row */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 border-t border-white/5">
                    {/* Left side - Like button with count */}
                    <button
                        onClick={handleLike}
                        className="flex items-center gap-2 group"
                    >
                        <div
                            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 active:scale-95 ${propLikeCount > 0 ? 'bg-red-500/20 border-red-500/40' : ''}`}
                        >
                            <Heart
                                className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${propLikeCount > 0 ? 'text-red-500 fill-red-500' : 'text-white group-hover:text-red-400'}`}
                            />
                            {/* Like animation */}
                            {showLike && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Heart className="w-8 h-8 text-red-500 fill-red-500 animate-ping" />
                                </div>
                            )}
                        </div>
                        <span className="text-white font-semibold text-sm sm:text-base min-w-[2.5rem]">
                            {propLikeCount >= 1000 ? `${(propLikeCount / 1000).toFixed(1)}k` : propLikeCount}
                        </span>
                    </button>

                    {/* Right side - Private Show & Send Tip */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Private Show Button with Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 sm:h-11 px-3 sm:px-4 rounded-full bg-transparent border-2 border-yellow-500/80 text-white hover:bg-yellow-500/20 hover:border-yellow-400 transition-all duration-200 font-semibold text-xs sm:text-sm"
                                >
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span className="hidden sm:inline">Private-Show</span>
                                    <span className="sm:hidden">Private</span>
                                    <span className="text-yellow-400 ml-1 sm:ml-1.5">
                                        {privateShowPrice} Tk
                                    </span>
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="bg-gray-900/95 backdrop-blur-md border-gray-700 text-white min-w-[200px]"
                                align="end"
                            >
                                <div className="px-3 py-2 border-b border-gray-700/50">
                                    <p className="text-xs text-gray-400 font-medium">
                                        Select Duration
                                    </p>
                                </div>
                                <DropdownMenuItem
                                    onClick={() => onPrivateShow?.(5)}
                                    className="flex items-center justify-between cursor-pointer hover:bg-gray-800 focus:bg-gray-800 py-2.5"
                                >
                                    <span className="text-sm">5 minutes</span>
                                    <span className="text-yellow-400 font-semibold text-sm">90 Tk</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onPrivateShow?.(10)}
                                    className="flex items-center justify-between cursor-pointer hover:bg-gray-800 focus:bg-gray-800 py-2.5"
                                >
                                    <span className="text-sm">10 minutes</span>
                                    <span className="text-yellow-400 font-semibold text-sm">170 Tk</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onPrivateShow?.(15)}
                                    className="flex items-center justify-between cursor-pointer hover:bg-gray-800 focus:bg-gray-800 py-2.5"
                                >
                                    <span className="text-sm">15 minutes</span>
                                    <span className="text-yellow-400 font-semibold text-sm">250 Tk</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onPrivateShow?.(30)}
                                    className="flex items-center justify-between cursor-pointer hover:bg-gray-800 focus:bg-gray-800 py-2.5"
                                >
                                    <span className="text-sm">30 minutes</span>
                                    <span className="text-yellow-400 font-semibold text-sm">450 Tk</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Send Tip Button */}
                        <Button
                            onClick={handleOpenTipDialog}
                            className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-green-600/30 transition-all duration-200 active:scale-95"
                        >
                            <span className="hidden sm:inline">Send Tip</span>
                            <span className="sm:hidden">Tip</span>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tip Dialog */}
            <TipDialog
                open={showTipDialog}
                onOpenChange={setShowTipDialog}
                modelId={modelId || ""}
                modelName={modelName}
                onTip={handleTip}
            />
        </div>
    );
}