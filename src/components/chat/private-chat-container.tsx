import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePrivateChat } from "@/hooks/use-private-chat";
import { PrivateMessageBubble } from "./private-message-bubble";
import { ConversationList } from "./conversation-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivateChatContainerProps {
    streamId: string;
    token: string | null;
    className?: string;
    initialPartnerId?: string | null;
}

export function PrivateChatContainer({
    streamId,
    token,
    className,
    initialPartnerId,
}: PrivateChatContainerProps) {
    const { data: session } = useSession();
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(initialPartnerId || null);
    const [messageInput, setMessageInput] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const [creatorInfo, setCreatorInfo] = useState<{ id: string, name: string, image?: string } | null>(null);

    const {
        messages,
        conversations,
        loading,
        error,
        sending,
        sendMessage,
    } = usePrivateChat({
        streamId: streamId === "homepage" ? "global" : streamId,
        receiverId: selectedPartnerId || undefined,
        token,
        enabled: streamId !== "homepage" && !!token,
    });

    // Fetch stream creator info (skip for homepage)
    useEffect(() => {
        const fetchCreatorInfo = async () => {
            try {
                const response = await fetch(`/api/streams/${streamId}`);
                if (response.ok) {
                    const data = await response.json();
                    const streamData = data?.stream ?? data;
                    const creator = streamData?.creator;
                    if (!creator) {
                        console.warn("No creator info returned for stream", streamId);
                        return;
                    }
                    setCreatorInfo({
                        id: creator.id,
                        name: creator.name,
                        image: creator.avatar
                    });
                }
            } catch (error) {
                console.error("Error fetching creator info:", error);
            }
        };

        if (streamId && streamId !== "homepage") {
            fetchCreatorInfo();
        }
    }, [streamId]);

    // Set initial partner when prop changes
    useEffect(() => {
        if (initialPartnerId && initialPartnerId !== selectedPartnerId) {
            setSelectedPartnerId(initialPartnerId);
        }
    }, [initialPartnerId, selectedPartnerId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle sending message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedPartnerId || sending) return;

        const success = await sendMessage(messageInput, selectedPartnerId);
        if (success) {
            setMessageInput("");
        }
    };

    // Handle key press in input
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const selectedPartner = conversations.find(c => c.partnerId === selectedPartnerId);

    if (!session) {
        return (
            <Card className={cn("flex items-center justify-center h-[400px] bg-gray-900 border-gray-700", className)}>
                <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 max-w-sm">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Sign In Required</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Please sign in to use private chat and connect with creators.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn("flex flex-col h-[400px] bg-gray-900 border-gray-700", className)}>
            {!selectedPartnerId ? (
                // Conversation list view
                <>
                    <div className="border-b border-gray-700 p-4 bg-gray-800/50 backdrop-blur-sm">
                        <h3 className="font-semibold text-sm flex items-center gap-3 text-white">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                            <MessageCircle className="w-5 h-5 text-purple-400" />
                            Private Messages
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-900/50 backdrop-blur-sm">
                        {/* Show "Message Creator" option if user is not the creator and no existing conversation */}
                        {creatorInfo && session?.user?.id !== creatorInfo.id && (
                            <div className="p-3">
                                {!conversations.find(c => c.partnerId === creatorInfo.id) && (
                                    <div className="mb-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start p-4 h-auto border-dashed border-purple-500/30 bg-gray-800/30 hover:bg-purple-600/10 hover:border-purple-400 text-white transition-all duration-200"
                                            onClick={() => setSelectedPartnerId(creatorInfo.id)}
                                        >
                                            <div className="flex items-center gap-4 w-full">
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                                                        {creatorInfo.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-gray-800 animate-pulse" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-left text-white">
                                                        Message {creatorInfo.name}
                                                    </p>
                                                    <p className="text-xs text-purple-300 text-left">
                                                        Creator • Start a private conversation
                                                    </p>
                                                </div>
                                                <MessageCircle className="w-5 h-5 text-purple-400" />
                                            </div>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        <ConversationList
                            conversations={conversations}
                            selectedPartnerId={selectedPartnerId || undefined}
                            onSelectConversation={setSelectedPartnerId}
                            className="p-3"
                        />

                        {/* Show available creators for homepage */}
                        {streamId === "homepage" && conversations.length === 0 && (
                            <div className="p-4 text-center">
                                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="h-8 w-8 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2 text-white">No Conversations Yet</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Start watching streams to chat with creators privately.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                // Individual conversation view
                <>
                    {/* Header */}
                    <div className="border-b border-gray-700 p-4 bg-gray-800/50 backdrop-blur-sm flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                            onClick={() => setSelectedPartnerId(null)}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm text-white">
                                {selectedPartner?.partnerName || "Private Chat"}
                            </h3>
                            {selectedPartner && (
                                <p className="text-xs text-purple-300 capitalize flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                    {selectedPartner.partnerRole.toLowerCase()}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto bg-gray-900/50 backdrop-blur-sm p-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-300">Loading messages...</p>
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700">
                                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <p className="text-sm text-gray-300 font-medium mb-1">No messages yet</p>
                                    <p className="text-xs text-gray-500">Start the conversation!</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {messages.map((message, index) => {
                                    const isOwnMessage = message.senderId === session?.user?.id;
                                    const showAvatar =
                                        index === 0 ||
                                        messages[index - 1].senderId !== message.senderId;

                                    return (
                                        <PrivateMessageBubble
                                            key={message.id}
                                            message={message}
                                            isOwnMessage={isOwnMessage}
                                            showAvatar={showAvatar}
                                        />
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Message input */}
                    <form onSubmit={handleSendMessage} className="border-t border-gray-700 p-4 bg-gray-800/50 backdrop-blur-sm">
                        {error && (
                            <div className="text-sm text-red-300 bg-red-900/20 border border-red-500/30 p-3 rounded-lg mb-3 backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Input
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type a private message..."
                                disabled={sending}
                                maxLength={500}
                                className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 backdrop-blur-sm"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!messageInput.trim() || sending}
                                className="bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg shadow-purple-600/25 transition-all duration-200 disabled:bg-gray-700 disabled:shadow-none"
                            >
                                {sending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                        <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                            <span className={`px-2 py-1 rounded ${messageInput.length > 400
                                    ? "text-orange-400 bg-orange-900/20"
                                    : "text-gray-400"
                                }`}>
                                {messageInput.length}/500 characters
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent"></div>
                        </div>
                    </form>
                </>
            )}
        </Card>
    );
}
