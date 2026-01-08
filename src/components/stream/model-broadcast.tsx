"use client";

import { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  VideoTrack,
  useConnectionState,
  useLocalParticipant,
  useRoomContext
} from '@livekit/components-react';
import {
  ConnectionState,
  Track
} from 'livekit-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Clock,
  Settings,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Loader2,
  PhoneOff,
  Eye,
  Wifi,
  Play,
  Pause,
  Camera,
  Heart
} from 'lucide-react';

interface ModelBroadcastProps {
  streamId: string;
  token: string;
  serverUrl: string;
  streamTitle: string;
  selectedCameraId?: string;
  onStreamEnd?: () => void;
  className?: string;
}

export function ModelBroadcast({
  streamId,
  token,
  serverUrl,
  streamTitle,
  selectedCameraId,
  onStreamEnd,
  className = ""
}: ModelBroadcastProps) {
  // Debug: Log connection parameters on mount
  useEffect(() => {
    console.log('🎬 ModelBroadcast mounting with:', {
      streamId,
      hasToken: !!token,
      tokenLength: token?.length,
      serverUrl,
      serverUrlValid: serverUrl?.startsWith('wss://') || serverUrl?.startsWith('ws://'),
    });
    
    if (!serverUrl) {
      console.error('❌ ModelBroadcast: No serverUrl provided!');
    }
    if (!token) {
      console.error('❌ ModelBroadcast: No token provided!');
    }
  }, [streamId, token, serverUrl]);

  // Handle connection errors
  const handleError = (error: Error) => {
    console.error('❌ LiveKit Room Error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
    });
  };

  const handleConnected = () => {
    console.log('✅ LiveKit Room Connected successfully for broadcaster');
  };

  const handleDisconnected = () => {
    console.log('🔴 LiveKit Room Disconnected for broadcaster');
  };

  // Show error if no serverUrl or token
  if (!serverUrl || !token) {
    return (
      <div className={`relative ${className} bg-black flex items-center justify-center min-h-[400px]`}>
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
          autoSubscribe: false, // Model doesn't need to subscribe to their own tracks
        }}
        onError={handleError}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        className="w-full h-full min-h-[400px] rounded-lg border bg-black"
      >
        <CreatorVideoView
          streamId={streamId}
          streamTitle={streamTitle}
          selectedCameraId={selectedCameraId}
          onStreamEnd={onStreamEnd}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

interface CreatorVideoViewProps {
  streamId: string;
  streamTitle: string;
  selectedCameraId?: string;
  onStreamEnd?: () => void;
}

function CreatorVideoView({ streamId, streamTitle: _streamTitle, selectedCameraId, onStreamEnd }: CreatorVideoViewProps) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  // Debug: Log connection state changes
  useEffect(() => {
    console.log('🔌 Broadcaster Connection State:', connectionState);
    console.log('👤 Local Participant:', localParticipant?.identity);
    console.log('🏠 Room:', room?.name, room?.state);
  }, [connectionState, localParticipant, room]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isEndingStream, setIsEndingStream] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [streamStats, setStreamStats] = useState({
    viewers: 0,
    likes: 0,
    duration: 0,
    quality: 'HD'
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isTogglingPause, setIsTogglingPause] = useState(false);

  // Auto-enable camera and microphone when connected (only once on initial connection)
  const [hasAutoEnabled, setHasAutoEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const enableDevices = async () => {
      if (connectionState === ConnectionState.Connected && localParticipant && !hasAutoEnabled && !isInitializing) {
        setIsInitializing(true);
        try {
          console.log('🎥 Connection established, enabling camera and microphone...');

          // Small delay to ensure connection is stable
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Enable camera with high quality settings and selected device
          console.log('📹 Enabling camera...');
          const cameraOptions = selectedCameraId ? { deviceId: selectedCameraId } : undefined;
          await localParticipant.setCameraEnabled(true, cameraOptions);
          setIsCameraEnabled(true);
          console.log('✅ Camera enabled successfully');

          // Small delay between devices
          await new Promise(resolve => setTimeout(resolve, 500));

          // Enable microphone
          console.log('🎤 Enabling microphone...');
          await localParticipant.setMicrophoneEnabled(true);
          setIsMicEnabled(true);
          console.log('✅ Microphone enabled successfully');

          // Mark as auto-enabled so it doesn't run again
          setHasAutoEnabled(true);
          setIsInitializing(false);

        } catch (error) {
          console.error('❌ Failed to enable camera/microphone:', error);
          setIsInitializing(false);

          // Try again after a short delay
          setTimeout(async () => {
            if (!hasAutoEnabled) {
              try {
                console.log('🔄 Retrying device initialization...');
                const cameraOptions = selectedCameraId ? { deviceId: selectedCameraId } : undefined;
                await localParticipant.setCameraEnabled(true, cameraOptions);
                await localParticipant.setMicrophoneEnabled(true);
                setIsCameraEnabled(true);
                setIsMicEnabled(true);
                setHasAutoEnabled(true);
                console.log('✅ Retry successful');
              } catch (retryError) {
                console.error('❌ Retry failed:', retryError);
              }
            }
          }, 2000);
        }
      }
    };

    enableDevices();
  }, [connectionState, localParticipant, hasAutoEnabled, isInitializing, selectedCameraId]);



  // Throttled viewer count updates (every 2 seconds max)
  useEffect(() => {
    const timer = setTimeout(() => {
      setStreamStats(prev => ({
        ...prev,
        viewers: participants.length
      }));
    }, 2000);

    return () => clearTimeout(timer);
  }, [participants.length]);

  // Fetch likes count periodically
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const response = await fetch(`/api/streams/${streamId}/likes`);
        if (response.ok) {
          const data = await response.json();
          setStreamStats(prev => ({
            ...prev,
            likes: data.likesCount
          }));
        }
      } catch (error) {
        console.error('Failed to fetch likes:', error);
      }
    };

    // Fetch initially
    fetchLikes();

    // Then fetch every 10 seconds
    const interval = setInterval(fetchLikes, 10000);
    return () => clearInterval(interval);
  }, [streamId]);

  // Update device states based on tracks - NO cleanup here (cleanup is in unmount effect)
  useEffect(() => {
    const cameraTrack = tracks.find(track => track.source === Track.Source.Camera);
    const screenShareTrack = tracks.find(track => track.source === Track.Source.ScreenShare);

    if (cameraTrack && hasAutoEnabled) {
      setIsCameraEnabled(cameraTrack.publication.isEnabled);
    }

    if (screenShareTrack) {
      setIsScreenSharing(screenShareTrack.publication.isEnabled);
    }
    // No cleanup here - tracks cleanup is handled in the unmount-only effect below
  }, [tracks, hasAutoEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up broadcast component...');

      // Stop all local tracks
      if (localParticipant) {
        localParticipant.videoTrackPublications.forEach((pub) => {
          if (pub.track) {
            pub.track.stop();
          }
        });
        localParticipant.audioTrackPublications.forEach((pub) => {
          if (pub.track) {
            pub.track.stop();
          }
        });
      }

      // Disconnect from room
      if (room) {
        room.disconnect();
      }
    };
  }, [localParticipant, room]);

  const handleStartBroadcast = async () => {
    if (!localParticipant) {
      console.error('❌ Cannot start broadcast: No local participant');
      return;
    }

    try {
      console.log('🚀 Manually starting broadcast...');
      console.log('Connection state:', connectionState);
      console.log('Local participant:', localParticipant.identity);

      // Enable camera first
      console.log('Enabling camera...');
      const cameraOptions = selectedCameraId ? { deviceId: selectedCameraId } : undefined;
      await localParticipant.setCameraEnabled(true, cameraOptions);
      setIsCameraEnabled(true);
      console.log('✅ Camera enabled');

      // Then enable microphone
      console.log('Enabling microphone...');
      await localParticipant.setMicrophoneEnabled(true);
      setIsMicEnabled(true);
      console.log('✅ Microphone enabled');

      console.log('✅ Manual broadcast started successfully');
    } catch (error) {
      console.error('❌ Failed to start broadcast manually:', error);
      alert(`Failed to start broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const toggleCamera = async () => {
    if (!localParticipant) return;
    try {
      const newState = !isCameraEnabled;
      const cameraOptions = selectedCameraId ? { deviceId: selectedCameraId } : undefined;
      await localParticipant.setCameraEnabled(newState, cameraOptions);
      setIsCameraEnabled(newState);
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  };

  const toggleMicrophone = async () => {
    if (!localParticipant) return;
    try {
      const newState = !isMicEnabled;
      await localParticipant.setMicrophoneEnabled(newState);
      setIsMicEnabled(newState);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  };

  const toggleScreenShare = async () => {
    if (!localParticipant) return;
    try {
      const newState = !isScreenSharing;
      await localParticipant.setScreenShareEnabled(newState);
      setIsScreenSharing(newState);
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  };

  const togglePause = async () => {
    if (isTogglingPause) return;

    setIsTogglingPause(true);
    try {
      const newPausedState = !isPaused;

      // Update pause state in database
      const response = await fetch(`/api/streams/${streamId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: newPausedState }),
      });

      if (response.ok) {
        setIsPaused(newPausedState);

        // If pausing, disable camera and mic but keep connection
        if (newPausedState) {
          if (isCameraEnabled) {
            await localParticipant?.setCameraEnabled(false);
          }
          if (isMicEnabled) {
            await localParticipant?.setMicrophoneEnabled(false);
          }
        } else {
          // If resuming, re-enable camera and mic with selected device
          const cameraOptions = selectedCameraId ? { deviceId: selectedCameraId } : undefined;
          await localParticipant?.setCameraEnabled(true, cameraOptions);
          setIsCameraEnabled(true);
          await localParticipant?.setMicrophoneEnabled(true);
          setIsMicEnabled(true);
        }
      } else {
        console.error('Failed to update pause state');
      }
    } catch (error) {
      console.error('Failed to toggle pause:', error);
    } finally {
      setIsTogglingPause(false);
    }
  };

  // Check pause state on mount and periodically (less frequently to reduce API load)
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
    // Increased from 5s to 15s to reduce API load
    const interval = setInterval(checkPauseState, 15000);
    return () => clearInterval(interval);
  }, [streamId]);

  // Get available cameras and microphones
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        // Get cameras
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(cameras);
        if (cameras.length > 0 && !selectedCamera) {
          setSelectedCamera(cameras[0].deviceId);
        }

        // Get microphones
        const microphones = devices.filter(device => device.kind === 'audioinput');
        setAvailableMicrophones(microphones);
        if (microphones.length > 0 && !selectedMicrophone) {
          setSelectedMicrophone(microphones[0].deviceId);
        }

        console.log('📹 Available cameras:', cameras.length);
        console.log('🎤 Available microphones:', microphones.length);
      } catch (error) {
        console.error('Error getting devices:', error);
      }
    };
    getDevices();
  }, [selectedCamera, selectedMicrophone]);

  const switchCamera = async (deviceId: string) => {
    if (!localParticipant) return;
    try {
      setSelectedCamera(deviceId);
      // Restart camera with new device
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setCameraEnabled(true, { deviceId });
      console.log('✅ Switched to camera:', deviceId);
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const switchMicrophone = async (deviceId: string) => {
    if (!localParticipant) return;
    try {
      setSelectedMicrophone(deviceId);
      // Restart microphone with new device
      await localParticipant.setMicrophoneEnabled(false);
      await localParticipant.setMicrophoneEnabled(true, { deviceId });
      console.log('✅ Switched to microphone:', deviceId);
    } catch (error) {
      console.error('Error switching microphone:', error);
    }
  };

  const handleEndStream = async () => {
    setIsEndingStream(true);
    try {
      await fetch(`/api/streams/${streamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' })
      });

      setShowEndDialog(false);
      onStreamEnd?.();
    } catch (error) {
      console.error('Error ending stream:', error);
      setIsEndingStream(false);
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

  const hasVideo = tracks.some(track =>
    track.source === Track.Source.Camera && track.publication.isEnabled
  );

  const hasScreenShare = tracks.some(track =>
    track.source === Track.Source.ScreenShare && track.publication.isEnabled
  );

  const isLive = connectionState === ConnectionState.Connected && (hasVideo || hasScreenShare);

  return (
    <div
      className={`relative ${isFullscreen ? 'h-screen' : 'h-full'} bg-black overflow-hidden rounded-lg`}
    >
      {/* Top Stats Bar - More compact on mobile */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-2 sm:p-4">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border ${isPaused
              ? 'bg-yellow-600/20 border-yellow-500/30'
              : 'bg-red-600/20 border-red-500/30'
              }`}>
              <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                }`} />
              <span className="font-bold text-xs sm:text-sm">
                {isPaused ? 'PAUSED' : isLive ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 bg-black/40 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-semibold text-xs sm:text-sm">{streamStats.viewers}</span>
              <span className="text-gray-300 text-xs hidden sm:inline">viewers</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 bg-black/40 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
              <span className="font-semibold text-xs sm:text-sm">{streamStats.likes}</span>
              <span className="text-gray-300 text-xs hidden sm:inline">likes</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Wifi className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-green-400">
                {connectionState === ConnectionState.Connected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleFullscreen}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-9 px-3 backdrop-blur-sm"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button
              onClick={() => setShowEndDialog(true)}
              disabled={isEndingStream}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700 hover:cursor-pointer h-9 px-3 sm:px-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isEndingStream ? (
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
              ) : (
                <PhoneOff className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{isEndingStream ? 'Ending...' : 'End Stream'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* End Stream Confirmation Dialog - Enhanced */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-2 border-gray-700/50 text-white max-w-md shadow-2xl">
          <DialogHeader className="space-y-4">
            {/* Icon with gradient background */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-900/50 ring-4 ring-red-500/20">
              <PhoneOff className="w-10 h-10 text-white" />
            </div>

            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                End Live Stream?
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-base leading-relaxed px-2">
                Are you sure you want to end this stream? This action cannot be undone and all viewers will be disconnected.
              </DialogDescription>
            </div>

            {/* Stream Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-1">
                    <Eye className="w-4 h-4" />
                    <span>Viewers</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{streamStats.viewers}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>Likes</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{streamStats.likes}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                  <div className="text-sm font-semibold">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-600/20 text-red-400 rounded-full border border-red-500/30">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      LIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter className="gap-3 sm:gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
              disabled={isEndingStream}
              className="flex-1 border-2 border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 h-11 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndStream}
              disabled={isEndingStream}
              className="flex-1 bg-gradient-to-r hover:cursor-pointer from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-900/30 transition-all duration-200 h-11 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isEndingStream ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PhoneOff className="w-4 h-4 mr-2" />
              )}
              {isEndingStream ? 'Ending Stream...' : 'End Stream'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Video Display */}
      <div className="absolute inset-0">
        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-yellow-600 animate-pulse">
                <Pause className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3">Stream Paused</h3>
              <p className="text-gray-300 text-sm sm:text-lg mb-8 px-4">
                Your stream is paused. Viewers are waiting for you to resume.
              </p>
              <Button
                onClick={togglePause}
                disabled={isTogglingPause}
                size="lg"
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
              >
                {isTogglingPause ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Resuming...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Resume Stream
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {tracks.length > 0 ? (
          <div className="h-full w-full relative">
            {tracks.map((track) => (
              <div key={track.participant.identity + track.source} className="absolute inset-0 flex items-center justify-center">
                <VideoTrack
                  trackRef={track}
                  className="w-full h-full object-contain"
                />

              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
            <div className="text-center text-white max-w-md w-full">
              {isInitializing ? (
                <>
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-4 border-purple-600 animate-pulse">
                    <Video className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Initializing...</h3>
                  <p className="text-gray-400 text-sm sm:text-lg mb-6 sm:mb-8 px-4">
                    Setting up your camera and microphone
                  </p>
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-4 border-gray-600">
                    <Video className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Ready to Go Live</h3>
                  <p className="text-gray-400 text-sm sm:text-lg mb-6 sm:mb-8 px-4">
                    Click the button below to start broadcasting to your viewers
                  </p>

                  <div className="flex items-center justify-center gap-3 sm:gap-6 mb-6 sm:mb-8 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isCameraEnabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <span className="text-xs sm:text-sm">Camera</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isMicEnabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <span className="text-xs sm:text-sm">Microphone</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${connectionState === ConnectionState.Connected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs sm:text-sm">Connection</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartBroadcast}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg active:scale-95 transition-transform"
                    disabled={connectionState !== ConnectionState.Connected}
                  >
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                    Start Broadcasting
                  </Button>

                  {connectionState !== ConnectionState.Connected && (
                    <p className="text-yellow-500 text-sm mt-4 animate-pulse">
                      Waiting for connection...
                    </p>
                  )}
                  {connectionState === ConnectionState.Connected && (
                    <p className="text-green-500 text-sm mt-4">
                      Ready to broadcast! Tap the button above.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Stream Controls - Always Visible */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-20 flex justify-center px-4">
        <div className="bg-black/90 backdrop-blur-lg rounded-full px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-700 shadow-xl w-full sm:w-auto max-w-sm sm:max-w-none">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {/* Pause/Resume Button */}
            <Button
              onClick={togglePause}
              variant="ghost"
              size="icon"
              disabled={isTogglingPause}
              className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full active:scale-95 transition-transform ${isPaused
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white animate-pulse'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              title={isPaused ? 'Resume Stream' : 'Pause Stream'}
            >
              {isTogglingPause ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPaused ? (
                <Play className="w-5 h-5" />
              ) : (
                <Pause className="w-5 h-5" />
              )}
            </Button>

            {/* Microphone Toggle */}
            <Button
              onClick={toggleMicrophone}
              variant="ghost"
              size="icon"
              disabled={isPaused}
              className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full active:scale-95 transition-transform ${isPaused
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : isMicEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              title={isPaused ? 'Stream Paused' : isMicEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicEnabled ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>

            {/* Camera Toggle */}
            <Button
              onClick={toggleCamera}
              variant="ghost"
              size="icon"
              disabled={isPaused}
              className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full active:scale-95 transition-transform ${isPaused
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : isCameraEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              title={isPaused ? 'Stream Paused' : isCameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isCameraEnabled ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </Button>

            {/* Screen Share Toggle */}
            <Button
              onClick={toggleScreenShare}
              variant="ghost"
              size="icon"
              disabled={isPaused}
              className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full active:scale-95 transition-transform ${isPaused
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : isScreenSharing
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              title={isPaused ? 'Stream Paused' : isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              {isScreenSharing ? (
                <MonitorOff className="w-5 h-5" />
              ) : (
                <Monitor className="w-5 h-5" />
              )}
            </Button>

            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white ml-1 sm:ml-2 active:scale-95 transition-transform"
                  title="More Options"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-700 text-white w-56 mb-2">
                {/* Camera Selection Submenu */}
                {availableCameras.length > 1 && isCameraEnabled && (
                  <>
                    <div className="px-2 py-1.5 text-xs text-gray-400 font-semibold">Switch Camera</div>
                    {availableCameras.map((camera) => (
                      <DropdownMenuItem
                        key={camera.deviceId}
                        onClick={() => switchCamera(camera.deviceId)}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800 pl-4"
                      >
                        <Camera className={`w-3.5 h-3.5 ${selectedCamera === camera.deviceId ? 'text-purple-400' : 'text-gray-400'}`} />
                        <span className="text-sm truncate">
                          {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
                        </span>
                        {selectedCamera === camera.deviceId && (
                          <span className="ml-auto text-xs text-purple-400">✓</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="bg-gray-700" />
                  </>
                )}

                {/* Microphone Selection Submenu */}
                {availableMicrophones.length > 1 && isMicEnabled && (
                  <>
                    <div className="px-2 py-1.5 text-xs text-gray-400 font-semibold">Switch Microphone</div>
                    {availableMicrophones.map((microphone) => (
                      <DropdownMenuItem
                        key={microphone.deviceId}
                        onClick={() => switchMicrophone(microphone.deviceId)}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800 pl-4"
                      >
                        <Mic className={`w-3.5 h-3.5 ${selectedMicrophone === microphone.deviceId ? 'text-blue-400' : 'text-gray-400'}`} />
                        <span className="text-sm truncate">
                          {microphone.label || `Microphone ${availableMicrophones.indexOf(microphone) + 1}`}
                        </span>
                        {selectedMicrophone === microphone.deviceId && (
                          <span className="ml-auto text-xs text-blue-400">✓</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Quality Indicator */}
      <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-10 bg-black/60 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-white text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full" />
          <span className="hidden sm:inline">1080p HD</span>
          <span className="sm:hidden">HD</span>
        </div>
      </div>
    </div>
  );
}