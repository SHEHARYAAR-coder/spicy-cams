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
            <Card className="flex items-center justify-center h-full min-h-[400px] bg-gray-900 border-gray-700">
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
            <Card className="flex items-center justify-center h-full min-h-[400px] bg-gray-900 border-gray-700">
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
        <div className={`relative flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden ${className || ''}`}>
            {/* Fixed Header - 56px */}
            <div className="absolute top-0 left-0 right-0 h-14 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm z-10 flex-shrink-0">
                <div className="h-full px-3 sm:px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                            <h3 className="font-semibold text-xs sm:text-sm text-white">Live Chat</h3>
                        </div>
                        {connected ? (
                            <div className="flex items-center gap-1">
                                <Wifi className={`h-3 w-3 flex-shrink-0 ${connectionQuality === 'good' ? 'text-green-400' :
                                        connectionQuality === 'poor' ? 'text-orange-400' :
                                            'text-red-400'
                                    }`} />
                                <span className={`text-xs font-medium hidden sm:inline ${connectionQuality === 'good' ? 'text-green-400' :
                                        connectionQuality === 'poor' ? 'text-orange-400' :
                                            'text-red-400'
                                    }`}>
                                    {connectionQuality === 'good' ? 'Connected' :
                                        connectionQuality === 'poor' ? 'Poor' :
                                            'Connecting...'}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <WifiOff className="h-3 w-3 text-red-400 flex-shrink-0" />
                                <span className="text-xs text-red-400 font-medium hidden sm:inline">Disconnected</span>
                            </div>
                        )}
                    </div>
                    <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded flex-shrink-0">
                        {messages.length}
                    </div>
                </div>
            </div>

            {/* Scrollable Messages Area - fills space between header and input */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="absolute top-14 left-0 right-0 bottom-[140px] overflow-y-auto px-2 sm:px-3 py-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                style={{ scrollBehavior: 'smooth' }}
            >
                {/* Load more indicator */}
                {hasMore && (
                    <div className="text-center py-2 mb-2">
                        {messagesLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                                <span className="text-xs text-gray-400">Loading...</span>
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={loadMoreMessages}
                                className="text-xs h-7 text-gray-400 hover:text-white hover:bg-gray-700/50"
                            >
                                Load earlier messages
                            </Button>
                        )}
                    </div>
                )}

                {/* Messages list */}
                <div className="space-y-3">
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
                    ))}
                </div>

                {/* Empty state */}
                {messages.length === 0 && !messagesLoading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center p-4">
                            <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <MessageCircle className="w-6 h-6 text-purple-400" />
                            </div>
                            <p className="text-sm text-gray-300 mb-1 font-medium">No messages yet</p>
                            <p className="text-xs text-gray-500">Be the first to say something!</p>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-[150px] right-3 z-20 h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg flex items-center justify-center transition-all duration-200"
                >
                    <ChevronUp className="h-4 w-4" />
                </button>
            )}

            {/* Fixed Input Area - 140px from bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[140px] border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm flex-shrink-0">
                {/* Error display */}
                {error && (
                    <div className="absolute top-0 left-0 right-0 px-3 pt-2">
                        <div className="bg-red-900/20 border border-red-500/30 rounded px-2 py-1 text-xs text-red-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{error}</span>
                        </div>
                    </div>
                )}

                <div className={error ? "pt-10" : "pt-0"}>
                    <ChatInput
                        onSend={sendMessage}
                        disabled={!connected}
                        remaining={remaining}
                    />
                </div>
            </div>
        </div>
    );
}
