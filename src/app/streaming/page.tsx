"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ModelBroadcast, ViewerPlayer, StreamCard } from '@/components/stream';
import { MediaPermissions } from '@/components/stream/media-permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Loader2, Video, Users, Plus, Upload, X, Tag, FolderOpen, Camera } from 'lucide-react';
import { TabbedChatContainer, MobileChatOverlay } from '@/components/chat';

interface Stream {
  id: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  thumbnailUrl?: string;
  status: 'LIVE' | 'SCHEDULED' | 'ENDED';
  createdAt: Date;
  model: {
    id: string;
    name: string;
    image?: string;
  };
  participantCount?: number;
}

export default function StreamingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState<'browse' | 'create' | 'broadcast' | 'watch'>('browse');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [streamToken, setStreamToken] = useState<string | null>(null);
  const [currentStreamData, setCurrentStreamData] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMediaPermissions, setHasMediaPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState<string>('');

  // New stream form
  const [newStream, setNewStream] = useState({
    title: '',
    description: '',
    category: '',
    tags: [] as string[],
    thumbnailUrl: '',
    cameraDeviceId: ''
  });
  const [tagInput, setTagInput] = useState('');

  // Camera selection state
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // Handle tag management
  const addTag = () => {
    if (tagInput.trim() && !newStream.tags.includes(tagInput.trim()) && newStream.tags.length < 10) {
      setNewStream(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewStream(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB for database storage');
      return;
    }

    // Convert to base64
    try {
      const base64 = await convertToBase64(file);
      setNewStream(prev => ({
        ...prev,
        thumbnailUrl: base64 as string
      }));
    } catch (error) {
      console.error('Error converting image:', error);
      alert('Failed to process image');
    }
  };

  // Helper function to convert file to base64 with compression
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 800x450 for thumbnails)
        const maxWidth = 800;
        const maxHeight = 450;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Stream categories
  const streamCategories = [
    "Asian",
    "BDSM",
    "Big Cock",
    "Big Tits",
    "Black",
    "Huge Tits",
    "Latino",
    "Mature",
    "Medium Tits",
    "Mobile",
    "Small Tits",
    "Teen 18+",
    "Transgirl",
    "Transguy",
    "Uncut"
  ]

  // Enumerate available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        // Request permissions first
        await navigator.mediaDevices.getUserMedia({ video: true });

        // Enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');

        setAvailableCameras(videoInputs);

        // Auto-select first camera if available
        if (videoInputs.length > 0 && !selectedCameraId) {
          const defaultCamera = videoInputs[0].deviceId;
          setSelectedCameraId(defaultCamera);
          setNewStream(prev => ({ ...prev, cameraDeviceId: defaultCamera }));
        }
      } catch (error) {
        console.error('Error enumerating cameras:', error);
      }
    };

    if (hasMediaPermissions) {
      getCameras();
    }
  }, [hasMediaPermissions]);


  // Fetch available streams
  const fetchStreams = async () => {
    try {
      const response = await fetch('/api/streams/list');
      if (response.ok) {
        const data = await response.json();
        const streamsWithDates = (data.streams || []).map((stream: any) => ({
          ...stream,
          createdAt: new Date(stream.createdAt),
          model: {
            id: stream.model?.id || stream.creator?.id || '',
            name: stream.model?.name || stream.creator?.name || 'Unknown',
            image: stream.model?.avatar || stream.model?.image || stream.creator?.avatar || stream.creator?.image
          }
        }));
        setStreams(streamsWithDates);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
    }
  };

  useEffect(() => {
    fetchStreams();
    // Refresh streams every 30 seconds
    const interval = setInterval(fetchStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle join stream from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinStreamId = urlParams.get('join');

    if (joinStreamId && session) {
      console.log('Auto-joining stream from URL:', joinStreamId);
      handleJoinStream(joinStreamId);
      // Clean up URL
      window.history.replaceState({}, '', '/streaming');
    }
  }, [session]);

  // Create a new stream
  const handleCreateStream = async () => {
    if (!newStream.title.trim() || !newStream.category.trim() || !newStream.cameraDeviceId) {
      alert('Please fill in all required fields including camera selection');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Creating stream with:', newStream);
      const response = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStream)
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Stream created successfully:', responseData);
        const stream = responseData.stream;
        setSelectedStream(stream.id);

        // model token
        console.log('🔑 Requesting creator token for stream:', stream.id);
        const tokenResponse = await fetch(`/api/streams/${stream.id}/token`, {
          method: 'POST'
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          console.log('✅ Token received:', tokenData.token.substring(0, 20) + '...');
          console.log('✅ Role from API:', tokenData.role);
          console.log('📝 Setting state - Stream ID:', stream.id);
          console.log('📝 Setting state - Token:', 'received');

          // IMPORTANT: Set mode based on role from API
          const newMode = tokenData.role === 'creator' ? 'broadcast' : 'watch';
          console.log('📝 Setting state - Mode:', newMode);

          setStreamToken(tokenData.token);
          setCurrentStreamData(stream);
          setSelectedStream(stream.id);
          setMode(newMode);
          setNewStream({ title: '', description: '', category: '', tags: [], thumbnailUrl: '', cameraDeviceId: '' }); // Reset form
          setTagInput('');

          console.log('✅ All state updated, mode should be:', newMode);
        } else {
          const error = await tokenResponse.json();
          console.error('❌ Failed to get token:', error);
          alert('Failed to get stream token');
        }
      } else {
        const error = await response.json();
        console.error('❌ Failed to create stream:', error);
        alert(error.error || 'Failed to create stream');
      }
    } catch (error) {
      console.error('❌ Error creating stream:', error);
      alert('Failed to create stream');
    }
    setLoading(false);
  };

  // Join a stream as viewer
  const handleJoinStream = async (streamId: string) => {
    setLoading(true);
    try {
      // Find the stream data
      const stream = streams.find(s => s.id === streamId);

      const response = await fetch(`/api/streams/${streamId}/token`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Joined stream, role:', data.role);

        // Set mode based on role from API
        const newMode = data.role === 'creator' ? 'broadcast' : 'watch';

        setStreamToken(data.token);
        setSelectedStream(streamId);
        setCurrentStreamData(stream || null);
        setMode(newMode);

        console.log('✅ Mode set to:', newMode);

        // Track watch history (only for viewers, not broadcasters)
        if (newMode === 'watch') {
          fetch('/api/watch-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ streamId }),
          }).catch(err => console.error('Failed to track watch history:', err));
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join stream');
      }
    } catch (error) {
      console.error('Error joining stream:', error);
      alert('Failed to join stream');
    }
    setLoading(false);
  };

  // End stream and go back to browse
  const handleStreamEnd = () => {
    setMode('browse');
    setSelectedStream(null);
    setStreamToken(null);
    fetchStreams(); // Refresh stream list
  };

  const LIVEKIT_SERVER_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center mt-12">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-gray-400 mb-4">Please sign in to access streaming features.</p>
              <Button onClick={() => router.push('/login')} className="w-full bg-purple-600 hover:bg-purple-700">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isModel = session.user && 'role' in session.user && session.user.role === 'MODEL';

  // Debug logging
  console.log('Current state:', { mode, selectedStream, streamToken, currentStreamData });

  return (
    <div className={`mt-12 bg-gray-900 text-white flex flex-col ${mode === 'broadcast' || mode === 'watch'
      ? 'h-screen lg:h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-4rem)] overflow-hidden'
      : 'min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]'
      } lg:overflow-hidden`}>
      <main className={`flex-1 flex flex-col min-h-0 ${mode === 'broadcast' || mode === 'watch'
        ? 'p-0 lg:container lg:mx-auto lg:px-4 lg:py-4 overflow-hidden'
        : 'container mx-auto px-4 py-4'
        }`}>
        <div className={`flex-none ${mode === 'create' ? 'hidden' : mode === 'broadcast' || mode === 'watch' ? 'hidden lg:block' : ''}`}>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Live Streaming</h1>
              <p className="text-gray-400">Create and watch live streams</p>
            </div>

            {/* Navigation */}
            <div className="flex gap-2">
              {mode !== 'broadcast' && (
                <Button
                  onClick={() => setMode('browse')}
                  variant={mode === 'browse' ? 'default' : 'outline'}
                  className={mode === 'browse' ? "bg-purple-600 text-white hover:bg-purple-700" : "border-gray-700 hover:bg-gray-800 hover:text-white"}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Browse Streams
                </Button>
              )}
              {(session.user && (((session.user as { role?: string }).role === 'MODEL') || ((session.user as { role?: string }).role === 'ADMIN')) && mode !== 'broadcast') && (
                <Button
                  onClick={() => setMode('create')}
                  variant={mode === 'create' ? 'default' : 'outline'}
                  className={mode === 'create' ? "bg-purple-600 hover:bg-purple-700" : "border-gray-700 hover:bg-gray-800 hover:text-white"}
                >
                  <Plus className="w-4 h-4" />
                  Go Live
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative">
          {/* Browse Mode */}
          {mode === 'browse' && (
            <div className="h-full overflow-y-auto pr-2 pb-4">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Live Streams</h2>
                  <Button onClick={fetchStreams} variant="outline" className="border-gray-700 text-white hover:bg-gray-800 hover:text-white">
                    Refresh
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {streams.map((stream) => (
                    <StreamCard
                      key={stream.id}
                      stream={stream}
                      onJoinStream={handleJoinStream}
                    />
                  ))}
                </div>

                {streams.length === 0 && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-12 text-center">
                      <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl text-white font-semibold mb-2">No streams available</h3>
                      <p className="text-gray-400 mb-4">Be the first to start streaming!</p>
                      {isModel && (
                        <Button onClick={() => setMode('create')} className="bg-purple-600 text-white hover:bg-purple-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Start Streaming
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Create Stream Mode */}
          {mode === 'create' && (
            <div className="h-full overflow-y-auto pr-2 pb-4">
              <div className="max-w-2xl mx-auto space-y-6">
                {!hasMediaPermissions ? (
                  <div>
                    <MediaPermissions
                      onPermissionsGranted={() => setHasMediaPermissions(true)}
                      onPermissionsDenied={(error) => setPermissionError(error)}
                    />
                    {permissionError && (
                      <Card className="mt-4 bg-red-900/20 border-red-500">
                        <CardContent className="p-4">
                          <p className="text-sm text-red-400">{permissionError}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700/50 text-white shadow-2xl shadow-purple-500/10">
                    <CardHeader className="border-b border-gray-700/50 pb-6">
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/50">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Start a New Stream
                          </div>
                          <p className="text-sm font-normal text-gray-400 mt-1">Configure your live broadcast settings</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      {/* Thumbnail Upload */}
                      <div className="group">
                        <label className="text-sm font-semibold mb-3 text-gray-200 flex items-center gap-2">
                          <Upload className="w-4 h-4 text-purple-400" />
                          Stream Thumbnail
                          <span className="text-xs font-normal text-gray-500">(Optional)</span>
                        </label>
                        <div className="flex flex-col gap-4">
                          {newStream.thumbnailUrl ? (
                            <div className="relative group/thumb">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={newStream.thumbnailUrl}
                                alt="Stream thumbnail"
                                className="w-full rounded-xl object-cover aspect-video border-2 border-gray-700 transition-all group-hover/thumb:border-purple-500 group-hover/thumb:shadow-lg group-hover/thumb:shadow-purple-500/20"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-all rounded-xl flex items-center justify-center">
                                <Button
                                  onClick={() => {
                                    // Clean up object URL if it's not a base64 string
                                    if (newStream.thumbnailUrl && !newStream.thumbnailUrl.startsWith('data:')) {
                                      URL.revokeObjectURL(newStream.thumbnailUrl);
                                    }
                                    setNewStream(prev => ({ ...prev, thumbnailUrl: '' }));
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="opacity-0 group-hover/thumb:opacity-100 transition-all bg-red-600 border-red-500 hover:bg-red-700 text-white"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="relative border-2 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-purple-500 hover:bg-purple-500/5 transition-all cursor-pointer group/upload overflow-hidden"
                              onClick={() => document.getElementById('thumbnail-upload')?.click()}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-purple-500/0 group-hover/upload:from-purple-500/5 group-hover/upload:via-pink-500/5 group-hover/upload:to-purple-500/5 transition-all duration-500"></div>
                              <div className="relative z-10">
                                <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                                  <Upload className="h-8 w-8 text-purple-400 group-hover/upload:text-purple-300 transition-colors" />
                                </div>
                                <p className="text-base font-medium text-gray-300 mb-2">Click to upload thumbnail</p>
                                <p className="text-sm text-gray-400 mb-1">or drag and drop</p>
                                <p className="text-xs text-gray-500">PNG, JPG up to 2MB • Recommended: 1280x720</p>
                              </div>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            className="hidden"
                            id="thumbnail-upload"
                          />
                          {!newStream.thumbnailUrl && (
                            <Button
                              onClick={() => document.getElementById('thumbnail-upload')?.click()}
                              variant="outline"
                              className="w-full sm:w-fit border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-purple-500 transition-all"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Browse Files
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Camera Selection */}
                      <div>
                        <label className="text-sm font-semibold mb-3 text-gray-200 flex items-center gap-2">
                          <Camera className="w-4 h-4 text-purple-400" />
                          Camera / Video Source
                          <span className="text-xs font-normal text-red-400">*</span>
                        </label>
                        <Select
                          value={selectedCameraId}
                          onValueChange={(value) => {
                            setSelectedCameraId(value);
                            setNewStream(prev => ({ ...prev, cameraDeviceId: value }));
                          }}
                        >
                          <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white hover:border-purple-500 transition-colors">
                            <div className="flex items-center gap-2">
                              <Camera className="h-4 w-4 text-purple-400" />
                              <SelectValue placeholder="Select your camera or video source" />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {availableCameras.length > 0 ? (
                              availableCameras.map((camera) => (
                                <SelectItem
                                  key={camera.deviceId}
                                  value={camera.deviceId}
                                  className="text-white hover:bg-gray-800 focus:bg-gray-800"
                                >
                                  {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-camera" disabled className="text-gray-500">
                                No cameras detected
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-400 mt-1">
                          Select your physical camera, OBS Virtual Camera, or other video input
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-3 text-gray-200 flex items-center gap-2">
                          <Video className="w-4 h-4 text-purple-400" />
                          Stream Title
                          <span className="text-xs font-normal text-red-400">*</span>
                        </label>
                        <Input
                          value={newStream.title}
                          onChange={(e) => setNewStream(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter an engaging stream title"
                          maxLength={100}
                          className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-600 transition-all h-11"
                        />
                        <p className="text-xs text-gray-400 mt-2 flex items-center justify-between">
                          <span>Make it catchy and descriptive</span>
                          <span className="font-medium">{newStream.title.length}/100</span>
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-3 text-gray-200 flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                          Description
                          <span className="text-xs font-normal text-gray-500">(Optional)</span>
                        </label>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-lg border border-gray-700 bg-gray-900/50 text-white px-4 py-3 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 hover:border-gray-600 transition-all disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                          value={newStream.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewStream(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what you'll be streaming about..."
                          rows={4}
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-400 mt-2 flex items-center justify-between">
                          <span>Help viewers know what to expect</span>
                          <span className="font-medium">{newStream.description.length}/500</span>
                        </p>
                      </div>

                      {/* Category Selection */}
                      <div>
                        <label className="text-sm font-semibold mb-3 text-gray-200 flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-purple-400" />
                          Category
                          <span className="text-xs font-normal text-red-400">*</span>
                        </label>
                        <Select
                          value={newStream.category}
                          onValueChange={(value) => setNewStream(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white hover:border-purple-500 transition-colors">
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4 text-purple-400" />
                              <SelectValue placeholder="Select a category" />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700 max-h-[300px]">
                            {streamCategories.map((category) => (
                              <SelectItem
                                key={category}
                                value={category}
                                className="text-white hover:bg-gray-800 focus:bg-gray-800"
                              >
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="text-sm font-semibold mb-3 text-gray-200 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-purple-400" />
                          Tags
                          <span className="text-xs font-normal text-gray-500">(Optional)</span>
                        </label>
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                              <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={handleTagKeyPress}
                                placeholder="Add a tag and press Enter"
                                className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-600 transition-all h-11"
                                maxLength={20}
                              />
                            </div>
                            <Button
                              onClick={addTag}
                              variant="outline"
                              disabled={!tagInput.trim() || newStream.tags.includes(tagInput.trim()) || newStream.tags.length >= 10}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-purple-500 transition-all disabled:opacity-50 w-full sm:w-auto h-11 px-6"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Tag
                            </Button>
                          </div>

                          {newStream.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-4 bg-gray-900/30 rounded-lg border border-gray-700/50">
                              {newStream.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 rounded-full text-sm border border-purple-500/30 hover:from-purple-600/30 hover:to-pink-600/30 hover:border-purple-500/50 transition-all shadow-sm"
                                >
                                  <span className="font-medium">#{tag}</span>
                                  <button
                                    onClick={() => removeTag(tag)}
                                    className="h-4 w-4 p-0 hover:text-red-400 transition-colors rounded-full hover:bg-red-500/20"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-400 flex items-center justify-between">
                            <span>Help viewers discover your stream</span>
                            <span className="font-medium text-purple-400">{newStream.tags.length}/10 tags</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-2 border-t border-gray-700/50">
                        <Button
                          onClick={handleCreateStream}
                          disabled={loading || !newStream.title.trim() || !newStream.category.trim() || !newStream.cameraDeviceId}
                          className="flex-1 text-white bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-700 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none h-12 text-base font-semibold"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Creating Stream...
                            </>
                          ) : (
                            <>
                              <Video className="w-5 h-5 mr-2" />
                              Start Streaming
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setMode('browse')}
                          variant="outline"
                          disabled={loading}
                          className="border-gray-600 text-white hover:bg-gray-700/50 hover:border-gray-500 transition-all h-12 sm:w-auto w-full px-8 font-medium"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Model Broadcast */}
          {mode === 'broadcast' && selectedStream && streamToken && (
            <div className="h-full flex flex-col">
              {/* Header - Hidden on mobile for full-screen video */}
              <div className="hidden lg:flex flex-none justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Broadcasting Live</h2>
                <Button
                  onClick={handleStreamEnd}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Back to Browse
                </Button>
              </div>

              {/* Desktop: Side-by-side layout | Mobile: Full-screen video */}
              <div className="flex-1 min-h-0">
                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-4 h-full">
                  {/* Video Section - Takes 2/3 width */}
                  <div className="lg:col-span-2 flex flex-col">
                    <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
                      <ModelBroadcast
                        streamId={selectedStream}
                        token={streamToken}
                        serverUrl={LIVEKIT_SERVER_URL}
                        streamTitle={currentStreamData?.title || newStream.title}
                        selectedCameraId={newStream.cameraDeviceId}
                        onStreamEnd={handleStreamEnd}
                        className="h-full w-full absolute inset-0"
                      />
                    </div>
                  </div>

                  {/* Chat Section - Takes 1/3 width */}
                  <div className="lg:col-span-1">
                    <TabbedChatContainer
                      streamId={selectedStream}
                      canModerate={true}
                      className="h-full w-full"
                    />
                  </div>
                </div>

                {/* Mobile Layout - True Full Screen Video */}
                <div className="lg:hidden fixed inset-0 bg-black z-10 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <ModelBroadcast
                      streamId={selectedStream}
                      token={streamToken}
                      serverUrl={LIVEKIT_SERVER_URL}
                      streamTitle={currentStreamData?.title || newStream.title}
                      selectedCameraId={newStream.cameraDeviceId}
                      onStreamEnd={handleStreamEnd}
                      className="w-full h-full"
                    />
                  </div>
                  {/* Floating Chat Overlay */}
                  <MobileChatOverlay streamId={selectedStream} canModerate={true} />
                </div>
              </div>
            </div>
          )}

          {/* Viewer Player */}
          {mode === 'watch' && selectedStream && streamToken && (
            <div className="h-full flex flex-col">
              {/* Header - Hidden on mobile for full-screen video */}
              <div className="hidden lg:flex flex-none justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Watching Stream</h2>
                <Button
                  onClick={handleStreamEnd}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Leave Stream
                </Button>
              </div>

              {/* Desktop: Side-by-side layout | Mobile: Full-screen video */}
              <div className="flex-1 min-h-0">
                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-4 h-full">
                  {/* Video Section - Takes 2/3 width */}
                  <div className="lg:col-span-2 flex flex-col">
                    <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
                      <ViewerPlayer
                        streamId={selectedStream}
                        token={streamToken}
                        serverUrl={LIVEKIT_SERVER_URL}
                        streamTitle={currentStreamData?.title}
                        modelName={currentStreamData?.model?.name}
                        className="h-full w-full absolute inset-0"
                      />
                    </div>
                  </div>

                  {/* Chat Section - Takes 1/3 width */}
                  <div className="lg:col-span-1">
                    <TabbedChatContainer
                      streamId={selectedStream}
                      canModerate={false}
                      className="h-full"
                    />
                  </div>
                </div>

                {/* Mobile Layout - True Full Screen Video */}
                <div className="lg:hidden fixed inset-0 bg-black z-10 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <ViewerPlayer
                      streamId={selectedStream}
                      token={streamToken}
                      serverUrl={LIVEKIT_SERVER_URL}
                      streamTitle={currentStreamData?.title}
                      modelName={currentStreamData?.model?.name}
                      className="w-full h-full"
                    />
                  </div>
                  {/* Floating Chat Overlay */}
                  <MobileChatOverlay streamId={selectedStream} canModerate={false} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
