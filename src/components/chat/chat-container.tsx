import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useChat } from "@/hooks/use-chat";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatGatePrompt } from "./chat-gate-prompt";
import { TipMenuDialog } from "./tip-menu-dialog";
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
    const [tipMenuOpen, setTipMenuOpen] = useState(false);

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

    // Handle tip
    const handleTip = async (tokens: number, activity?: string) => {
        try {
            // TODO: Implement actual tip API call
            console.log(`Tipping ${tokens} tokens${activity ? ` for ${activity}` : ''}`);

            // For now, just send a message in chat
            const message = activity
                ? `Tipped ${tokens} tokens for ${activity} 💝`
                : `Tipped ${tokens} tokens 💝`;

            await sendMessage(message);

            // You can add a toast notification here
            // toast.success(`Sent ${tokens} tokens!`);
        } catch (error) {
            console.error("Error sending tip:", error);
            // toast.error("Failed to send tip");
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
        <div className={`relative flex flex-col h-full bg-gray-900 overflow-hidden ${className || ''}`}>
            {/* Compact Header */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gray-800/80 backdrop-blur-md z-10 flex-shrink-0">
                <div className="h-full px-3 sm:px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        {connected ? (
                            <Wifi className={`h-3.5 w-3.5 flex-shrink-0 ${connectionQuality === 'good' ? 'text-green-400' :
                                connectionQuality === 'poor' ? 'text-orange-400' :
                                    'text-red-400'
                                }`} />
                        ) : (
                            <WifiOff className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                        )}
                        <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                            {connected ?
                                (connectionQuality === 'good' ? 'Connected' :
                                    connectionQuality === 'poor' ? 'Unstable' : 'Connecting...')
                                : 'Offline'
                            }
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 bg-gray-700/60 px-2 py-0.5 rounded-full flex-shrink-0">
                        {messages.length}
                    </div>
                </div>
            </div>

            {/* Scrollable Messages Area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="absolute top-12 left-0 right-0 bottom-[120px] overflow-y-auto px-2 sm:px-3 py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
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
                    <div className="flex items-center justify-center h-full min-h-[240px]">
                        <div className="text-center p-6 max-w-[280px] mx-auto">
                            <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-purple-500/20">
                                <MessageCircle className="w-10 h-10 text-purple-400" />
                            </div>
                            <p className="text-lg text-white mb-2 font-semibold">No messages yet</p>
                            <p className="text-sm text-gray-300">Be the first to say something!</p>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-[130px] right-3 z-20 h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg flex items-center justify-center transition-all duration-200"
                >
                    <ChevronUp className="h-4 w-4" />
                </button>
            )}

            {/* Fixed Input Area */}
            <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-gray-800/80 backdrop-blur-md flex-shrink-0">
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
                        onOpenTipMenu={() => setTipMenuOpen(true)}
                    />
                </div>
            </div>

            {/* Tip Menu Dialog */}
            <TipMenuDialog
                open={tipMenuOpen}
                onOpenChange={setTipMenuOpen}
                onTip={handleTip}
            />
        </div>
    );
}
