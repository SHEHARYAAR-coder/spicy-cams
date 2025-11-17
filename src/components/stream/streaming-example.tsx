"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CreatorBroadcast, ViewerPlayer, StreamCard } from '@/components/stream';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Example usage component for the streaming system
export function StreamingExample() {
    const { data: session } = useSession();
    const [mode, setMode] = useState<'create' | 'watch' | 'browse'>('browse');
    const [streams, setStreams] = useState([]);
    const [selectedStream, setSelectedStream] = useState<string | null>(null);
    const [streamToken, setStreamToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // New stream form
    const [newStream, setNewStream] = useState({
        title: '',
        description: ''
    });

    // Fetch available streams
    const fetchStreams = async () => {
        try {
            const response = await fetch('/api/streams/list');
            if (response.ok) {
                const data = await response.json();
                setStreams(data.streams || []);
            }
        } catch (error) {
            console.error('Error fetching streams:', error);
        }
    };

    useEffect(() => {
        fetchStreams();
    }, []);

    // Create a new stream
    const handleCreateStream = async () => {
        if (!newStream.title.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/streams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStream)
            });

            if (response.ok) {
                const stream = await response.json();
                setSelectedStream(stream.id);
                setMode('create');

                // Get creator token
                const tokenResponse = await fetch(`/api/streams/${stream.id}/token`, {
                    method: 'POST'
                });

                if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json();
                    setStreamToken(tokenData.token);
                }
            }
        } catch (error) {
            console.error('Error creating stream:', error);
        }
        setLoading(false);
    };

    // Join a stream as viewer
    const handleJoinStream = async (streamId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/streams/${streamId}/token`, {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                setStreamToken(data.token);
                setSelectedStream(streamId);
                setMode('watch');
            }
        } catch (error) {
            console.error('Error joining stream:', error);
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

    if (!session) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p>Please sign in to access streaming features.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Navigation */}
            <div className="flex gap-2">
                <Button
                    onClick={() => setMode('browse')}
                    variant={mode === 'browse' ? 'default' : 'outline'}
                >
                    Browse Streams
                </Button>
                {session.user && 'role' in session.user && session.user.role === 'CREATOR' && (
                    <Button
                        onClick={() => setMode('create')}
                        variant={mode === 'create' ? 'default' : 'outline'}
                    >
                        Go Live
                    </Button>
                )}
            </div>

            {/* Browse Mode */}
            {mode === 'browse' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Live Streams</h2>
                        <Button onClick={fetchStreams}>Refresh</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {streams.map((stream: any) => (
                            <StreamCard
                                key={stream.id}
                                stream={stream}
                                onJoinStream={handleJoinStream}
                            />
                        ))}
                    </div>

                    {streams.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-gray-500">No streams available</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Create Stream Mode */}
            {mode === 'create' && !selectedStream && (
                <Card>
                    <CardHeader>
                        <CardTitle>Start a New Stream</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Stream Title</label>
                            <Input
                                value={newStream.title}
                                onChange={(e) => setNewStream(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter stream title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newStream.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewStream(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe your stream"
                                rows={3}
                            />
                        </div>

                        <Button
                            onClick={handleCreateStream}
                            disabled={loading || !newStream.title.trim()}
                            className="w-full"
                        >
                            {loading ? 'Creating...' : 'Start Stream'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Creator Broadcast */}
            {mode === 'create' && selectedStream && streamToken && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Broadcasting</h2>
                        <Button
                            onClick={handleStreamEnd}
                            variant="outline"
                        >
                            Back to Browse
                        </Button>
                    </div>

                    <CreatorBroadcast
                        streamId={selectedStream}
                        token={streamToken}
                        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ''}
                        streamTitle="Example Stream"
                        onStreamEnd={handleStreamEnd}
                    />
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
                        >
                            Leave Stream
                        </Button>
                    </div>

                    <ViewerPlayer
                        streamId={selectedStream}
                        token={streamToken}
                        serverUrl={LIVEKIT_SERVER_URL}
                        className="aspect-video max-w-4xl mx-auto"
                    />
                </div>
            )}
        </div>
    );
}