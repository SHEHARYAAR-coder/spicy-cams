"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

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

interface StreamListItem {
    id: string;
    modelId: string;
    modelName: string;
    title: string;
}

interface StreamContextType {
    isStreaming: boolean;
    streamData: StreamData | null;
    streamList: StreamListItem[];
    currentStreamIndex: number;
    setStreamData: (data: StreamData | null) => void;
    clearStreamData: () => void;
    updateStreamList: (streams: StreamListItem[]) => void;
    navigateToStream: (direction: 'next' | 'prev') => string | null;
    setCurrentStreamById: (streamId: string) => void;
    refreshStreamList: () => Promise<void>;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

// Local storage key for caching stream list
const STREAM_LIST_CACHE_KEY = 'spicycams_stream_list';
const CACHE_EXPIRY_KEY = 'spicycams_stream_list_expiry';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export function StreamProvider({ children }: { children: ReactNode }) {
    const [streamData, setStreamDataState] = useState<StreamData | null>(null);
    const [streamList, setStreamList] = useState<StreamListItem[]>([]);
    const [currentStreamIndex, setCurrentStreamIndex] = useState<number>(-1);

    // Load cached stream list from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem(STREAM_LIST_CACHE_KEY);
                const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);

                if (cached && expiry) {
                    const expiryTime = parseInt(expiry, 10);
                    const now = Date.now();

                    if (now < expiryTime) {
                        const parsedList = JSON.parse(cached);
                        setStreamList(parsedList);
                        console.log('📋 Loaded cached stream list:', parsedList.length, 'streams');
                    } else {
                        // Cache expired, clear it
                        localStorage.removeItem(STREAM_LIST_CACHE_KEY);
                        localStorage.removeItem(CACHE_EXPIRY_KEY);
                        console.log('⏰ Stream list cache expired');
                    }
                }
            } catch (error) {
                console.error('Error loading cached stream list:', error);
            }
        }
    }, []);

    // Update current stream index when streamData changes
    useEffect(() => {
        if (streamData && streamList.length > 0) {
            const index = streamList.findIndex(s => s.id === streamData.id || s.modelId === streamData.model.id);
            if (index !== -1) {
                setCurrentStreamIndex(index);
                console.log('📍 Current stream index updated:', index, '/', streamList.length);
            }
        }
    }, [streamData, streamList]);

    const setStreamData = useCallback((data: StreamData | null) => {
        setStreamDataState(data);
        console.log('🎥 Stream data updated:', data?.title || 'cleared');
    }, []);

    const clearStreamData = useCallback(() => {
        setStreamDataState(null);
        setCurrentStreamIndex(-1);
        console.log('🧹 Stream data cleared');
    }, []);

    const updateStreamList = useCallback((streams: StreamListItem[]) => {
        setStreamList(streams);

        // Cache to localStorage with expiry
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(STREAM_LIST_CACHE_KEY, JSON.stringify(streams));
                localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
                console.log('💾 Stream list cached:', streams.length, 'streams');
            } catch (error) {
                console.error('Error caching stream list:', error);
            }
        }
    }, []);

    const refreshStreamList = useCallback(async () => {
        try {
            console.log('🔄 Refreshing stream list from API...');
            const response = await fetch('/api/streams/list');
            if (response.ok) {
                const data = await response.json();
                const streams: StreamListItem[] = (data.streams || []).map((stream: { id: string; model?: { id?: string; name?: string }; creator?: { id?: string; name?: string }; title?: string }) => ({
                    id: stream.id,
                    modelId: stream.model?.id || stream.creator?.id,
                    modelName: stream.model?.name || stream.creator?.name || 'Unknown',
                    title: stream.title || 'Untitled Stream'
                }));
                updateStreamList(streams);
                console.log('✅ Stream list refreshed:', streams.length, 'streams');
            }
        } catch (error) {
            console.error('❌ Error refreshing stream list:', error);
        }
    }, [updateStreamList]);

    const setCurrentStreamById = useCallback((streamId: string) => {
        const index = streamList.findIndex(s => s.id === streamId);
        if (index !== -1) {
            setCurrentStreamIndex(index);
            console.log('🎯 Set current stream by ID:', streamId, 'at index', index);
        }
    }, [streamList]);

    const navigateToStream = useCallback((direction: 'next' | 'prev'): string | null => {
        if (streamList.length === 0) {
            console.log('⚠️ No streams available for navigation');
            return null;
        }

        if (currentStreamIndex === -1) {
            console.log('⚠️ No current stream index set');
            return null;
        }

        let newIndex: number;
        if (direction === 'next') {
            newIndex = (currentStreamIndex + 1) % streamList.length;
        } else {
            newIndex = (currentStreamIndex - 1 + streamList.length) % streamList.length;
        }

        const targetStream = streamList[newIndex];
        console.log(`⏭️ Navigating ${direction} from index ${currentStreamIndex} to ${newIndex}:`, targetStream.modelName);

        return targetStream.id;
    }, [streamList, currentStreamIndex]);

    return (
        <StreamContext.Provider
            value={{
                isStreaming: !!streamData,
                streamData,
                streamList,
                currentStreamIndex,
                setStreamData,
                clearStreamData,
                updateStreamList,
                navigateToStream,
                setCurrentStreamById,
                refreshStreamList
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
