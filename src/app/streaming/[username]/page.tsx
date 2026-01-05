"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ModelBroadcast, ViewerPlayer, StreamCard } from '@/components/stream';
import { TabbedChatContainer, MobileChatOverlay } from '@/components/chat';
import { useStream } from '@/contexts/StreamContext';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

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

// CategoryRow component for recommended streams
interface CategoryRowProps {
  category: string;
  streams: Stream[];
  onJoinStream: (streamId: string) => void;
  currentStreamId?: string;
}

function CategoryRow({ category, streams, onJoinStream, currentStreamId }: CategoryRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Filter out current stream from recommendations
  const filteredStreams = streams.filter(stream => stream.id !== currentStreamId);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -800 : 800;
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollability, 100);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollability();
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);

      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [filteredStreams]);

  if (filteredStreams.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 px-2 md:px-3 text-white">{category}</h2>

      <div className="relative group">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 text-white p-2 md:p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        {/* Streams Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-2 md:px-3 scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {filteredStreams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              onJoinStream={onJoinStream}
              className="w-[210px] sm:w-[240px] md:w-[280px] lg:w-[300px] flex-shrink-0"
            />
          ))}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 text-white p-2 md:p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function StreamByUsernamePage() {
  const { data: session } = useSession();

  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { setStreamData, clearStreamData, updateStreamList, setCurrentStreamById } = useStream();

  const [stream, setStream] = useState<Stream | null>(null);
  const [streamToken, setStreamToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'watch' | 'broadcast'>('watch');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/desktop to render only one layout (prevents duplicate API calls)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [recommendedStreams, setRecommendedStreams] = useState<Stream[]>([]);

  // Fetch random live streams for recommendations
  const fetchRecommendations = async (currentStreamId?: string) => {
    try {
      const response = await fetch('/api/streams/list?status=live');
      if (response.ok) {
        const data = await response.json();
        const streamsWithDates = (data.streams || []).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          model: {
            id: s.model?.id || s.creator?.id || '',
            name: s.model?.name || s.creator?.name || 'Unknown',
            image: s.model?.avatar || s.model?.image || s.creator?.avatar || s.creator?.image
          }
        }));

        // Filter out current stream and only show LIVE streams
        const liveStreams = streamsWithDates.filter((s: Stream) =>
          s.status === 'LIVE' && s.id !== currentStreamId
        );

        // Shuffle the streams randomly
        const shuffled = liveStreams.sort(() => Math.random() - 0.5);

        setRecommendedStreams(shuffled.slice(0, 20));

        // Update stream list in context for navigation
        const streamListItems = streamsWithDates
          .filter((s: Stream) => s.status === 'LIVE')
          .map((s: Stream) => ({
            id: s.id,
            modelId: s.model.id,
            modelName: s.model.name,
            title: s.title
          }));
        updateStreamList(streamListItems);
        console.log('📋 Updated stream list in context:', streamListItems.length, 'streams');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  // Handle joining another stream
  const handleJoinStream = (streamId: string) => {
    // Navigate to the stream - the API will provide the username
    router.push(`/streaming?join=${streamId}`);
  };

  // Fetch stream by username - only once
  useEffect(() => {
    // Prevent re-fetching if already fetched or currently loading
    if (hasFetched || !username) return;

    const fetchStreamByUsername = async () => {
      try {
        setLoading(true);
        setError(null);
        setHasFetched(true); // Mark as fetched immediately to prevent duplicate calls

        console.log('Fetching stream for username:', username);

        const response = await fetch(`/api/streams/by-username/${username}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Stream not found or user is not streaming');
          } else {
            setError('Failed to load stream');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        const streamData = data.stream;

        console.log('Stream data received:', streamData.id);
        setStream(streamData);

        // Get token for this stream
        const tokenResponse = await fetch(`/api/streams/${streamData.id}/token`, {
          method: 'POST'
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          console.log('Token received, role:', tokenData.role);
          setStreamToken(tokenData.token);
          setMode(tokenData.role === 'creator' ? 'broadcast' : 'watch');

          // Update stream context
          setStreamData({
            id: streamData.id,
            title: streamData.title,
            description: streamData.description,
            model: streamData.model,
            category: streamData.category
          });

          // Set current stream in context for navigation
          setCurrentStreamById(streamData.id);
          console.log('🎯 Set current stream in context:', streamData.id);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching stream:', err);
        setError('Failed to load stream');
        setLoading(false);
      }
    };

    fetchStreamByUsername();
  }, [username, hasFetched]); // Only depend on username and hasFetched

  // Fetch recommendations when stream is loaded and user is viewing (not broadcasting)
  useEffect(() => {
    if (stream && mode === 'watch') {
      fetchRecommendations(stream.id);
    }
  }, [stream, mode]);

  const handleStreamEnd = () => {
    clearStreamData();
    router.push('/streaming');
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">{error || 'Stream not found'}</p>
          <button
            onClick={() => router.push('/streaming')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Streaming
          </button>
        </div>
      </div>
    );
  }

  if (stream.status === 'ENDED') {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">This stream has ended</p>
          <button
            onClick={() => router.push('/streaming')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Streaming
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {mode === 'broadcast' && streamToken ? (
        <div className="h-full flex flex-col">
          {/* Render only one layout based on screen size to prevent duplicate hooks */}
          {!isMobile ? (
            /* Desktop Layout */
            <div className="grid grid-cols-3 gap-0 h-screen pt-[100px]">
              {/* Video Section - Takes 2/3 width */}
              <div className="col-span-2 flex flex-col p-4">
                <div className="flex-1 bg-black rounded-xl overflow-hidden relative shadow-2xl">
                  <ModelBroadcast
                    streamId={stream.id}
                    token={streamToken}
                    serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ''}
                    streamTitle={stream.title}
                    onStreamEnd={handleStreamEnd}
                    className="h-full w-full absolute inset-0"
                  />
                </div>
              </div>

              {/* Chat Section - Takes 1/3 width */}
              <div className="col-span-1 bg-gray-900 border-l border-gray-800 h-[calc(100vh-100px)]">
                <TabbedChatContainer
                  streamId={stream.id}
                  canModerate={true}
                  className="h-full w-full"
                />
              </div>
            </div>
          ) : (
            /* Mobile Layout - Full Screen Video */
            <div className="fixed inset-0 bg-black z-10 overflow-hidden pt-[80px]">
              <div className="w-full h-full flex items-center justify-center">
                <ModelBroadcast
                  streamId={stream.id}
                  token={streamToken}
                  serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ''}
                  streamTitle={stream.title}
                  onStreamEnd={handleStreamEnd}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating Chat Overlay */}
              <MobileChatOverlay streamId={stream.id} canModerate={true} />
            </div>
          )}
        </div>
      ) : streamToken ? (
        <div className="min-h-screen flex flex-col">
          {/* Render only one layout based on screen size to prevent duplicate hooks */}
          {!isMobile ? (
            /* Desktop Layout */
            <div className="pt-[100px]">
              <div className="grid grid-cols-3 gap-0 h-[calc(100vh-100px)]">
                {/* Video Section - Takes 2/3 width */}
                <div className="col-span-2 flex flex-col p-4 overflow-y-auto">
                  <div className="bg-black rounded-xl overflow-hidden relative shadow-2xl min-h-[400px] aspect-video">
                    <ViewerPlayer
                      streamId={stream.id}
                      token={streamToken}
                      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ''}
                      modelName={stream.model?.name || 'Model'}
                      streamTitle={stream.title}
                      className="h-full w-full absolute inset-0"
                    />
                  </div>

                  {/* Recommendations Section - Below video on desktop */}
                  {recommendedStreams.length > 0 && (
                    <div className="mt-8">
                      <CategoryRow
                        category="More Live Streams"
                        streams={recommendedStreams}
                        onJoinStream={handleJoinStream}
                        currentStreamId={stream.id}
                      />
                    </div>
                  )}
                </div>

                {/* Chat Section - Takes 1/3 width */}
                <div className="col-span-1 bg-gray-900 border-l border-gray-800 h-[calc(100vh-100px)]">
                  <TabbedChatContainer
                    streamId={stream.id}
                    canModerate={false}
                    className="h-full w-full"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Mobile Layout - Full Screen Video */
            <div className="fixed inset-0 bg-black z-10 overflow-hidden pt-[80px]">
              <div className="w-full h-full flex items-center justify-center">
                <ViewerPlayer
                  streamId={stream.id}
                  token={streamToken}
                  serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ''}
                  modelName={stream.model?.name || 'Model'}
                  streamTitle={stream.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating Chat Overlay */}
              <MobileChatOverlay streamId={stream.id} canModerate={false} />
            </div>
          )}
        </div>
      ) : (
        <div className="h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
            <p className="text-white text-lg">Loading stream...</p>
          </div>
        </div>
      )}
    </div>
  );
}
