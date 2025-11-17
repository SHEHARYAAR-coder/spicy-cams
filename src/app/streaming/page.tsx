"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CreatorBroadcast, ViewerPlayer, StreamCard } from '@/components/stream';
import { MediaPermissions } from '@/components/stream/media-permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Loader2, Video, Users, Plus, Upload, X, Tag, FolderOpen } from 'lucide-react';
import { TabbedChatContainer } from '@/components/chat';

interface Stream {
  id: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  thumbnailUrl?: string;
  status: 'LIVE' | 'SCHEDULED' | 'ENDED';
  createdAt: Date;
  creator: {
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
    thumbnailUrl: ''
  });
  const [tagInput, setTagInput] = useState('');

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


  // Fetch available streams
  const fetchStreams = async () => {
    try {
      const response = await fetch('/api/streams/list');
      if (response.ok) {
        const data = await response.json();
        const streamsWithDates = (data.streams || []).map((stream: any) => ({
          ...stream,
          createdAt: new Date(stream.createdAt),
          creator: {
            ...stream.creator,
            image: stream.creator.avatar // Map avatar to image for consistency
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
    if (!newStream.title.trim()) return;

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

        // Get creator token
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
          setNewStream({ title: '', description: '', category: '', tags: [], thumbnailUrl: '' }); // Reset form
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
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

  const isCreator = session.user && 'role' in session.user && session.user.role === 'CREATOR';

  // Debug logging
  console.log('Current state:', { mode, selectedStream, streamToken, currentStreamData });

  return (
    <div className="min-h-screen bg-gray-900 text-white">


      <main className="container mx-auto px-4 py-8">
        <div className="">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Live Streaming</h1>
              <p className="text-gray-400">Create and watch live streams</p>
            </div>

            {/* Navigation */}
            <div className="flex gap-2">
              <Button
                onClick={() => setMode('browse')}
                variant={mode === 'browse' ? 'default' : 'outline'}
                className={mode === 'browse' ? "bg-purple-600 hover:bg-purple-700" : "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"}
              >
                <Users className="w-4 h-4 mr-2" />
                Browse Streams
              </Button>
              {(session.user && ((session.user as any).role === 'CREATOR' || (session.user as any).role === 'ADMIN')) && (
                <Button
                  onClick={() => setMode('create')}
                  variant={mode === 'create' ? 'default' : 'outline'}
                  className={mode === 'create' ? "bg-purple-600 hover:bg-purple-700" : "border-gray-700 text-gray-900 hover:bg-gray-800 hover:text-white"}
                >
                  <Plus className="w-4 h-4" />
                  Go Live
                </Button>
              )}
            </div>
          </div>

          {/* Browse Mode */}
          {mode === 'browse' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Live Streams</h2>
                <Button onClick={fetchStreams} variant="outline" className="border-gray-700 text-gray-900 hover:bg-gray-800 hover:text-white">
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
                    {isCreator && (
                      <Button onClick={() => setMode('create')} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Start Streaming
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Create Stream Mode */}
          {mode === 'create' && (
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
                <Card className="bg-gray-800 border-gray-700 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-6 h-6" />
                      Start a New Stream
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Thumbnail Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Stream Thumbnail</label>
                      <div className="flex flex-col gap-4">
                        {newStream.thumbnailUrl ? (
                          <div className="relative">
                            <img
                              src={newStream.thumbnailUrl}
                              alt="Stream thumbnail"
                              className="w-full max-w-xs rounded-lg object-cover aspect-video"
                            />
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
                              className="absolute top-2 right-2 h-8 w-8 p-0 bg-gray-800/80 border-gray-600 hover:bg-gray-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-400 mb-2">Upload a thumbnail image</p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 2MB (auto-compressed)</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                          id="thumbnail-upload"
                        />
                        <Button
                          onClick={() => document.getElementById('thumbnail-upload')?.click()}
                          variant="outline"
                          className="w-fit border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {newStream.thumbnailUrl ? 'Change Thumbnail' : 'Upload Thumbnail'}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Stream Title *</label>
                      <Input
                        value={newStream.title}
                        onChange={(e) => setNewStream(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter an engaging stream title"
                        maxLength={100}
                        className="bg-gray-900 border-gray-700 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">{newStream.title.length}/100</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newStream.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewStream(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what you'll be streaming about..."
                        rows={4}
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-400 mt-1">{newStream.description.length}/500</p>
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Category *</label>
                      <div className="relative">
                        <FolderOpen className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <select
                          value={newStream.category}
                          onChange={(e) => setNewStream(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select a category</option>
                          {streamCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Tags</label>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyPress={handleTagKeyPress}
                              placeholder="Add a tag and press Enter"
                              className="pl-10 bg-gray-900 border-gray-700 focus:ring-purple-500"
                              maxLength={20}
                            />
                          </div>
                          <Button
                            onClick={addTag}
                            variant="outline"
                            disabled={!tagInput.trim() || newStream.tags.includes(tagInput.trim()) || newStream.tags.length >= 10}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            Add
                          </Button>
                        </div>

                        {newStream.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {newStream.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
                              >
                                {tag}
                                <Button
                                  onClick={() => removeTag(tag)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-purple-500/30"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-500">Add tags to help viewers find your stream (max 10 tags)</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleCreateStream}
                        disabled={loading || !newStream.title.trim() || !newStream.category.trim()}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating Stream...
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            Start Streaming
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setMode('browse')}
                        variant="outline"
                        className="border-gray-700 text-gray-900 hover:bg-gray-800 hover:text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Creator Broadcast */}
          {mode === 'broadcast' && selectedStream && streamToken && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Broadcasting Live</h2>
                <Button
                  onClick={handleStreamEnd}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Back to Browse
                </Button>
              </div>

              {/* Video + Chat Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Video Section - Takes 2/3 width on large screens */}
                <div className="lg:col-span-2">
                  <CreatorBroadcast
                    streamId={selectedStream}
                    token={streamToken}
                    serverUrl={LIVEKIT_SERVER_URL}
                    streamTitle={currentStreamData?.title || newStream.title}
                    onStreamEnd={handleStreamEnd}
                  />
                </div>

                {/* Chat Section - Takes 1/3 width on large screens */}
                <div className="lg:col-span-1">
                  <div className="h-[600px] lg:h-full">
                    <TabbedChatContainer
                      streamId={selectedStream}
                      canModerate={true}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Viewer Player */}
          {mode === 'watch' && selectedStream && streamToken && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Watching Stream</h2>
                <Button
                  onClick={handleStreamEnd}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Leave Stream
                </Button>
              </div>

              {/* Video + Chat Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Video Section - Takes 2/3 width on large screens */}
                <div className="lg:col-span-2">
                  <ViewerPlayer
                    streamId={selectedStream}
                    token={streamToken}
                    serverUrl={LIVEKIT_SERVER_URL}
                    streamTitle={currentStreamData?.title}
                    creatorName={currentStreamData?.creator?.name}
                    className="aspect-video w-full"
                  />
                </div>

                {/* Chat Section - Takes 1/3 width on large screens */}
                <div className="lg:col-span-1">
                  <div className="h-[600px] lg:h-full">
                    <TabbedChatContainer
                      streamId={selectedStream}
                      canModerate={false}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
