"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

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

interface StreamContextType {
    isStreaming: boolean;
    streamData: StreamData | null;
    setStreamData: (data: StreamData | null) => void;
    clearStreamData: () => void;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export function StreamProvider({ children }: { children: ReactNode }) {
    const [streamData, setStreamDataState] = useState<StreamData | null>(null);

    const setStreamData = (data: StreamData | null) => {
        setStreamDataState(data);
    };

    const clearStreamData = () => {
        setStreamDataState(null);
    };

    return (
        <StreamContext.Provider
            value={{
                isStreaming: !!streamData,
                streamData,
                setStreamData,
                clearStreamData
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
