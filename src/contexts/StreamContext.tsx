"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StreamModel {
    id: string;
    name: string;
    image?: string;
}

interface StreamData {
    id: string;
    title: string;
    description?: string;
    model: StreamModel;
    category?: string;
}

interface ActiveStream {
    id: string;
    title: string;
    model: StreamModel;
    category?: string;
}

interface StreamContextType {
    isStreaming: boolean;
    streamData: StreamData | null;
    activeStreams: ActiveStream[];
    currentStreamIndex: number;
    setStreamData: (data: StreamData | null) => void;
    clearStreamData: () => void;
    refreshActiveStreams: () => Promise<void>;
    navigateToNextStream: () => void;
    navigateToPreviousStream: () => void;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export function StreamProvider({ children }: { children: ReactNode }) {
    const [streamData, setStreamDataState] = useState<StreamData | null>(null);
    const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
    const [currentStreamIndex, setCurrentStreamIndex] = useState(-1);

    // Fetch active/live streams
    const refreshActiveStreams = async () => {
        try {
            const response = await fetch('/api/streams/list?status=live');
            if (response.ok) {
                const data = await response.json();
                const streams: ActiveStream[] = (data.streams || []).map((stream: any) => ({
                    id: stream.id,
                    title: stream.title,
                    model: {
                        id: stream.model?.id || '',
                        name: stream.model?.name || 'Unknown',
                        image: stream.model?.avatar || stream.model?.image
                    },
                    category: stream.category
                }));
                setActiveStreams(streams);

                // Update current index if we have stream data
                if (streamData) {
                    const index = streams.findIndex(s => s.id === streamData.id);
                    setCurrentStreamIndex(index);
                }
            }
        } catch (error) {
            console.error('Error fetching active streams:', error);
        }
    };

    // Update current stream index when stream data changes
    useEffect(() => {
        if (streamData && activeStreams.length > 0) {
            const index = activeStreams.findIndex(s => s.id === streamData.id);
            setCurrentStreamIndex(index);
        }
    }, [streamData, activeStreams]);

    // Refresh active streams periodically when streaming
    useEffect(() => {
        if (streamData) {
            refreshActiveStreams();
            const interval = setInterval(refreshActiveStreams, 30000); // Every 30 seconds
            return () => clearInterval(interval);
        }
    }, [streamData]);

    const setStreamData = (data: StreamData | null) => {
        setStreamDataState(data);
        if (data) {
            refreshActiveStreams();
        }
    };

    const clearStreamData = () => {
        setStreamDataState(null);
        setActiveStreams([]);
        setCurrentStreamIndex(-1);
    };

    const navigateToNextStream = () => {
        if (currentStreamIndex >= 0 && currentStreamIndex < activeStreams.length - 1) {
            const nextStream = activeStreams[currentStreamIndex + 1];
            if (nextStream) {
                // Navigate to next stream
                window.location.href = `/streaming?stream=${nextStream.id}`;
            }
        }
    };

    const navigateToPreviousStream = () => {
        if (currentStreamIndex > 0) {
            const previousStream = activeStreams[currentStreamIndex - 1];
            if (previousStream) {
                // Navigate to previous stream
                window.location.href = `/streaming?stream=${previousStream.id}`;
            }
        }
    };

    return (
        <StreamContext.Provider
            value={{
                isStreaming: !!streamData,
                streamData,
                activeStreams,
                currentStreamIndex,
                setStreamData,
                clearStreamData,
                refreshActiveStreams,
                navigateToNextStream,
                navigateToPreviousStream
            }}
        >
            {children}
        </StreamContext.Provider>
    );
}

export function useStream() {
    const context = useContext(StreamContext);
    if (context === undefined) {
        throw new Error('useStream must be used within a StreamProvider');
    }
    return context;
}
