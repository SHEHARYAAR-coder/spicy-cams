import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useChat } from "@/hooks/use-chat";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatGatePrompt } from "./chat-gate-prompt";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, Wifi, WifiOff, ChevronUp, MessageCircle } from "lucide-react";

interface ChatContainerProps {
    streamId: string;
    canModerate?: boolean;
    className?: string;
    onStartPrivateChat?: (userId: string, userName: string) => void;
}export function ChatContainer({ streamId, canModerate = false, className, onStartPrivateChat }: ChatContainerProps) {
    const { data: session } = useSession();
    const [chatToken, setChatToken] = useState<string | null>(null);
    const [canChat, setCanChat] = useState(true);
    const [chatReason, setChatReason] = useState<string | null>(null);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);

    // Get chat token
    useEffect(() => {
        const fetchChatToken = async () => {
            if (!session?.user?.id) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/streams/${streamId}/chat/token`, {
                    method: "POST",
                });

                if (response.ok) {
                    const data = await response.json();
                    setChatToken(data.token);
                    setCanChat(data.canChat);
                } else {
                    const data = await response.json();
                    setCanChat(false);
                    setChatReason(data.reason);

                    // Fetch balance if chat is gated
                    const balanceResponse = await fetch("/api/wallet/balance");
                    if (balanceResponse.ok) {
                        const balanceData = await balanceResponse.json();
                        setBalance(Number(balanceData.balance) || 0);
                    }
                }
            } catch (error) {
                console.error("Error fetching chat token:", error);
                setCanChat(false);
                setChatReason("Failed to connect to chat");
            } finally {
                setLoading(false);
            }
        };

        fetchChatToken();
    }, [streamId, session]);

    const {
        messages,
        connected,
        error,
        sendMessage,
        loadMoreMessages,
        hasMore,
        loading: messagesLoading,
        remaining,
        connectionQuality,
    } = useChat({
        streamId,
        token: chatToken,
        enabled: canChat && !!chatToken,
    });

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (autoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, autoScroll]);

    // Handle scroll to detect if user scrolled up
    const handleScroll = () => {
        if (!messagesContainerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

        setAutoScroll(isAtBottom);
        setShowScrollButton(!isAtBottom);

        // Load more messages when scrolling to top
        if (scrollTop < 100 && hasMore && !messagesLoading) {
            loadMoreMessages();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setAutoScroll(true);
    };

    // Handle moderation actions
    const handleDeleteMessage = async (messageId: string) => {
        try {
            await fetch(`/api/streams/${streamId}/moderate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "delete",
                    messageId,
                    reason: "Inappropriate content",
                }),
            });
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    const handleMuteUser = async (userId: string) => {
        try {
            await fetch(`/api/streams/${streamId}/moderate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "mute",
                    targetUserId: userId,
                    duration: 60,
                    reason: "Muted by moderator",
                }),
            });
        } catch (error) {
            console.error("Error muting user:", error);
        }
    };

    const handleBanUser = async (userId: string) => {
        if (!confirm("Are you sure you want to ban this user?")) return;

        try {
            await fetch(`/api/streams/${streamId}/moderate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "ban",
                    targetUserId: userId,
                    reason: "Banned by moderator",
                }),
            });
        } catch (error) {
            console.error("Error banning user:", error);
        }
    };

    // Loading state
    if (loading) {
        return (
            <Card className="flex items-center justify-center h-[600px] bg-gray-900 border-gray-700">
                <div className="text-center bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-purple-400" />
                    <p className="text-sm text-gray-300 font-medium">Loading chat...</p>
                </div>
            </Card>
        );
    }

    // Not authenticated
    if (!session) {
        return (
            <Card className="flex items-center justify-center h-[600px] bg-gray-900 border-gray-700">
                <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 max-w-sm">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Sign In Required</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Please sign in to participate in chat and connect with other viewers.
                    </p>
                </div>
            </Card>
        );
    }

    // Chat gated (no credits)
    if (!canChat) {
        return <ChatGatePrompt balance={balance} reason={chatReason || undefined} />;
    }

    return (
        <Card className={`flex flex-col h-[600px] bg-gray-900 border-gray-700 ${className || ''}`}>
            {/* Header */}
            <div className="border-b border-gray-700 p-3 flex items-center justify-between bg-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <h3 className="font-semibold text-sm text-white">Live Chat</h3>
                    </div>
                    {connected ? (
                        <div className="flex items-center gap-1">
                            <Wifi className={`h-4 w-4 ${
                                connectionQuality === 'good' ? 'text-green-400' : 
                                connectionQuality === 'poor' ? 'text-orange-400' : 
                                'text-red-400'
                            }`} />
                            <span className={`text-xs font-medium ${
                                connectionQuality === 'good' ? 'text-green-400' : 
                                connectionQuality === 'poor' ? 'text-orange-400' : 
                                'text-red-400'
                            }`}>
                                {connectionQuality === 'good' ? 'Connected' : 
                                 connectionQuality === 'poor' ? 'Poor Connection' : 
                                 'Connecting...'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <WifiOff className="h-4 w-4 text-red-400" />
                            <span className="text-xs text-red-400 font-medium">Disconnected</span>
                        </div>
                    )}
                </div>
                <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                    {messages.length} {messages.length === 1 ? "message" : "messages"}
                </div>
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-900/50 backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
            >
                {/* Load more indicator */}
                {hasMore && (
                    <div className="text-center py-3">
                        {messagesLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                                <span className="text-xs text-gray-400">Loading messages...</span>
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={loadMoreMessages}
                                className="text-xs text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-600 hover:border-purple-500/50 transition-all duration-200"
                            >
                                Load earlier messages
                            </Button>
                        )}
                    </div>
                )}

                {/* Messages list */}
                {messages.map((message) => (
                    <ChatMessage
                        key={message.id}
                        message={message}
                        currentUserId={session?.user?.id || ''}
                        canModerate={canModerate}
                        onDelete={handleDeleteMessage}
                        onMute={handleMuteUser}
                        onBan={handleBanUser}
                        onPrivateMessage={onStartPrivateChat}
                    />
                ))}                {/* Empty state */}
                {messages.length === 0 && !messagesLoading && (
                    <div className="flex items-center justify-center h-full text-center p-6">
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                            <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <MessageCircle className="w-6 h-6 text-purple-400" />
                            </div>
                            <p className="text-sm text-gray-300 mb-2 font-medium">No messages yet</p>
                            <p className="text-xs text-gray-500">Be the first to say something!</p>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <div className="absolute bottom-32 right-4">
                    <Button
                        size="icon"
                        onClick={scrollToBottom}
                        className="rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 text-white border-2 border-gray-700 hover:border-purple-500 transition-all duration-200 animate-bounce"
                    >
                        <ChevronUp className="h-5 w-5" />
                    </Button>
                </div>
            )}

            {/* Error display */}
            {error && (
                <div className="mx-4 mb-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Input */}
            <ChatInput
                onSend={sendMessage}
                disabled={!connected}
                remaining={remaining}
            />
        </Card>
    );
}
