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

  // Auto-enable camera and microphone when connected
  useEffect(() => {
    const enableDevices = async () => {
      if (connectionState === ConnectionState.Connected && localParticipant && !isCameraEnabled) {
        try {
          console.log('Connection established, enabling camera and microphone...');

          // Small delay to ensure connection is stable
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Enable camera with high quality settings
          await localParticipant.setCameraEnabled(true);
          setIsCameraEnabled(true);
          console.log('✅ Camera enabled successfully');

          // Enable microphone
          await localParticipant.setMicrophoneEnabled(true);
          setIsMicEnabled(true);
          console.log('✅ Microphone enabled successfully');

        } catch (error) {
          console.error('❌ Failed to enable camera/microphone:', error);
          // Try again after a short delay
          setTimeout(async () => {
            try {
              await localParticipant.setCameraEnabled(true);
              await localParticipant.setMicrophoneEnabled(true);
              setIsCameraEnabled(true);
              setIsMicEnabled(true);
              console.log('✅ Retry successful');
            } catch (retryError) {
              console.error('❌ Retry failed:', retryError);
            }
          }, 2000);
        }
      }
    };

    enableDevices();
  }, [connectionState, localParticipant, isCameraEnabled]);



  // Update viewer count and device states
  useEffect(() => {
    setStreamStats(prev => ({
      ...prev,
      viewers: participants.length
    }));
  }, [participants.length]);

  // Update device states based on tracks
  useEffect(() => {
    const cameraTrack = tracks.find(track => track.source === Track.Source.Camera);
    const screenShareTrack = tracks.find(track => track.source === Track.Source.ScreenShare);

    if (cameraTrack) {
      setIsCameraEnabled(cameraTrack.publication.isEnabled);
    }

    if (screenShareTrack) {
      setIsScreenSharing(screenShareTrack.publication.isEnabled);
    }
  }, [tracks]);

  const handleStartBroadcast = async () => {
    if (!localParticipant) return;

    try {
      console.log('Manually starting broadcast...');
      await localParticipant.setCameraEnabled(true);
      await localParticipant.setMicrophoneEnabled(true);
      setIsCameraEnabled(true);
      setIsMicEnabled(true);
      console.log('Manual broadcast started successfully');
    } catch (error) {
      console.error('Failed to start broadcast manually:', error);
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
      {/* Top Stats Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-4">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 bg-red-600/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-red-500/30">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-sm sm:text-base">
                {isLive ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Eye className="w-4 h-4" />
              <span className="font-semibold text-sm">{streamStats.viewers}</span>
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
              <div key={track.participant.identity + track.source} className="absolute inset-0">
                <VideoTrack
                  trackRef={track}
                  className="w-full h-full object-cover"
                />
               
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-gray-600">
                <Video className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-3xl font-bold mb-3">Ready to Go Live</h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                Click the button below to start broadcasting to your viewers
              </p>

              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isCameraEnabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="text-sm">Camera</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isMicEnabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="text-sm">Microphone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${connectionState === ConnectionState.Connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">Connection</span>
                </div>
              </div>

              <Button
                onClick={handleStartBroadcast}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg font-semibold rounded-xl"
                disabled={connectionState !== ConnectionState.Connected}
              >
                <Play className="w-6 h-6 mr-2" />
                Start Broadcasting
              </Button>

              {connectionState !== ConnectionState.Connected && (
                <p className="text-yellow-500 text-sm mt-4">
                  Waiting for connection...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stream Controls Menu */}
      <div className="absolute bottom-6 left-6 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-black/60 backdrop-blur-lg border-gray-600 text-white hover:bg-black/80 hover:text-white h-10 w-10"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-900 border-gray-700 text-white w-56">
            <DropdownMenuItem
              onClick={toggleCamera}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
            >
              {isCameraEnabled ? (
                <Video className="w-4 h-4 text-green-400" />
              ) : (
                <VideoOff className="w-4 h-4 text-red-400" />
              )}
              <span>
                {isCameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
              </span>
            </DropdownMenuItem>

            {/* Camera Selection Submenu */}
            {availableCameras.length > 1 && isCameraEnabled && (
              <>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="px-2 py-1.5 text-xs text-gray-400 font-semibold">Switch Camera</div>
                {availableCameras.map((camera) => (
                  <DropdownMenuItem
                    key={camera.deviceId}
                    onClick={() => switchCamera(camera.deviceId)}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800 pl-6"
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
              </>
            )}

            <DropdownMenuSeparator className="bg-gray-700" />

            <DropdownMenuItem
              onClick={toggleMicrophone}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
            >
              {isMicEnabled ? (
                <Mic className="w-4 h-4 text-green-400" />
              ) : (
                <MicOff className="w-4 h-4 text-red-400" />
              )}
              <span>
                {isMicEnabled ? 'Turn Off Microphone' : 'Turn On Microphone'}
              </span>
            </DropdownMenuItem>

            {/* Microphone Selection Submenu */}
            {availableMicrophones.length > 1 && isMicEnabled && (
              <>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="px-2 py-1.5 text-xs text-gray-400 font-semibold">Switch Microphone</div>
                {availableMicrophones.map((microphone) => (
                  <DropdownMenuItem
                    key={microphone.deviceId}
                    onClick={() => switchMicrophone(microphone.deviceId)}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800 pl-6"
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

            <DropdownMenuSeparator className="bg-gray-700" />

            <DropdownMenuItem
              onClick={toggleScreenShare}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
            >
              {isScreenSharing ? (
                <MonitorOff className="w-4 h-4 text-orange-400" />
              ) : (
                <Monitor className="w-4 h-4 text-blue-400" />
              )}
              <span>
                {isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quality Indicator */}
      <div className="absolute bottom-6 right-6 z-10 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg text-white text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span>1080p HD</span>
        </div>
      </div>
    </div>
  );
}