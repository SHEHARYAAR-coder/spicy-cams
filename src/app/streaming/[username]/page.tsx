"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ModelBroadcast, ViewerPlayer } from '@/components/stream';
import { TabbedChatContainer, MobileChatOverlay } from '@/components/chat';
import { useStream } from '@/contexts/StreamContext';
import { Loader2 } from 'lucide-react';

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

export default function StreamByUsernamePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { setStreamData, clearStreamData } = useStream();

  const [stream, setStream] = useState<Stream | null>(null);
  const [streamToken, setStreamToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'watch' | 'broadcast'>('watch');
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Fetch stream by username
  useEffect(() => {
    const fetchStreamByUsername = async () => {
      try {
        setLoading(true);
        setError(null);

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

        setStream(streamData);

        // Get token for this stream
        const tokenResponse = await fetch(`/api/streams/${streamData.id}/token`, {
          method: 'POST'
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
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
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching stream:', err);
        setError('Failed to load stream');
        setLoading(false);
      }
    };

    fetchStreamByUsername();
  }, [username, setStreamData]);

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
        <div className="w-full h-screen flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ModelBroadcast
              streamId={stream.id}
              token={streamToken}
              serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ''}
              streamTitle={stream.title}
              onStreamEnd={handleStreamEnd}
              className="w-full h-full"
            />
          </div>
        </div>
      ) : streamToken ? (
        <div className="w-full h-screen flex flex-col lg:flex-row gap-4 p-4 lg:p-0">
          {/* Video Player */}
          <div className="flex-1 lg:flex-none lg:w-2/3">
            <div className="rounded-lg overflow-hidden lg:rounded-none lg:h-screen lg:w-full">
              <ViewerPlayer
                streamId={stream.id}
                token={streamToken}
                serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ''}
                modelName={stream.model?.name || 'Model'}
                streamTitle={stream.title}
              />
            </div>
          </div>

          {/* Chat - Desktop */}
          <div className="hidden lg:flex lg:flex-col lg:w-1/3 lg:h-screen lg:bg-gray-900 lg:border-l lg:border-gray-800">
            <TabbedChatContainer
              streamId={stream.id}
              canModerate={mode === 'broadcast'}
            />
          </div>

          {/* Chat - Mobile Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileChat(!showMobileChat)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mb-4"
            >
              {showMobileChat ? 'Hide Chat' : 'Show Chat'}
            </button>

            {showMobileChat && (
              <MobileChatOverlay
                streamId={stream.id}
                canModerate={mode === 'broadcast'}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-white">Loading stream...</p>
          </div>
        </div>
      )}
    </div>
  );
}
