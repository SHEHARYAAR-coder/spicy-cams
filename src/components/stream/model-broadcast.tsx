"use client";

import { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  ControlBar,
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
  Track,
  Room
} from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Radio,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Users,
  Clock,
  Settings,
  Maximize2,
  Minimize2,
  AlertCircle,
  Mic,
  MicOff,
  Loader2,
  PhoneOff,
  Eye,
  Wifi,
  Play,
  MoreVertical,
  Menu,
  Camera,
  SwitchCamera
} from 'lucide-react';

interface ModelBroadcastProps {
  streamId: string;
  token: string;
  serverUrl: string;
  streamTitle: string;
  onStreamEnd?: () => void;
  className?: string;
}

export function ModelBroadcast({
  streamId,
  token,
  serverUrl,
  streamTitle,
  onStreamEnd,
  className = ""
}: ModelBroadcastProps) {
  return (
    <div className={`relative ${className}`}>
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connectOptions={{
          autoSubscribe: false, // Model doesn't need to subscribe to their own tracks
        }}

        className="w-full h-full min-h-[400px] rounded-lg border bg-black"
      >
        <CreatorVideoView
          streamId={streamId}
          streamTitle={streamTitle}
          onStreamEnd={onStreamEnd}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

// Live Timer Component
function LiveTimer({ startTime }: { startTime: Date }) {
  const [duration, setDuration] = useState('00:00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="font-mono">{duration}</span>;
}

interface CreatorVideoViewProps {
  streamId: string;
  streamTitle: string;
  onStreamEnd?: () => void;
}

function CreatorVideoView({ streamId, streamTitle, onStreamEnd }: CreatorVideoViewProps) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [streamStats, setStreamStats] = useState({
    viewers: 0,
    duration: 0,
    quality: 'HD'
  });

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

          // Enable camera with high quality settings
          console.log('📹 Enabling camera...');
          await localParticipant.setCameraEnabled(true);
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
                await localParticipant.setCameraEnabled(true);
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
  }, [connectionState, localParticipant, hasAutoEnabled, isInitializing]);



  // Update viewer count and device states
  useEffect(() => {
    setStreamStats(prev => ({
      ...prev,
      viewers: participants.length
    }));
  }, [participants.length]);

  // Update device states based on tracks - only update if tracks exist
  useEffect(() => {
    const cameraTrack = tracks.find(track => track.source === Track.Source.Camera);
    const screenShareTrack = tracks.find(track => track.source === Track.Source.ScreenShare);

    // Only update camera state if we have a camera track (don't clear it during initialization)
    if (cameraTrack && hasAutoEnabled) {
      setIsCameraEnabled(cameraTrack.publication.isEnabled);
    }

    if (screenShareTrack) {
      setIsScreenSharing(screenShareTrack.publication.isEnabled);
    }
  }, [tracks, hasAutoEnabled]);

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
      await localParticipant.setCameraEnabled(true);
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
      await localParticipant.setCameraEnabled(newState);
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
  }, []);

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
            <div className="flex items-center gap-1.5 sm:gap-2 bg-red-600/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-red-500/30">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-xs sm:text-sm">
                {isLive ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 bg-black/40 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-semibold text-xs sm:text-sm">{streamStats.viewers}</span>
              <span className="text-gray-300 text-xs hidden sm:inline">viewers</span>
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
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700 h-9 px-3 sm:px-4"
            >
              <PhoneOff className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">End Stream</span>
            </Button>
          </div>
        </div>
      </div>

      {/* End Stream Confirmation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">End Live Stream?</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to end this stream? This action cannot be undone and all viewers will be disconnected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndStream}
              className="bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              End Stream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Video Display */}
      <div className="absolute inset-0">
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
            {/* Microphone Toggle */}
            <Button
              onClick={toggleMicrophone}
              variant="ghost"
              size="icon"
              className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full active:scale-95 transition-transform ${isMicEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              title={isMicEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
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
              className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full active:scale-95 transition-transform ${isCameraEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              title={isCameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
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
              className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full active:scale-95 transition-transform ${isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
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