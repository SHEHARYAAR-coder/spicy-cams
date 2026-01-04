import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePrivateChat } from "@/hooks/use-private-chat";
import { PrivateMessageBubble } from "./private-message-bubble";
import { ConversationList } from "./conversation-list";
import { PrivateChatRequestNotification } from "./private-chat-request-notification";
import { ChatRequestDialog } from "./chat-request-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Send, MessageCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivateChatContainerProps {
    streamId: string;
    token: string | null;
    className?: string;
    initialPartnerId?: string | null;
    isModel?: boolean; // Whether the user is the stream model
}

export function PrivateChatContainer({
    streamId,
    token,
    className,
    initialPartnerId,
    isModel = false,
}: PrivateChatContainerProps) {
    const { data: session } = useSession();
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(initialPartnerId || null);
    const [messageInput, setMessageInput] = useState("");
    const [showRequestDialog, setShowRequestDialog] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const [creatorInfo, setCreatorInfo] = useState<{ id: string, name: string, image?: string } | null>(null);
    const [creatorRequestStatus, setCreatorRequestStatus] = useState<"NONE" | "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED">("NONE");

    const {
        messages,
        conversations,
        chatRequests,
        requestStatus,
        loading,
        error,
        sending,
        sendMessage,
        sendChatRequest,
        acceptChatRequest,
        rejectChatRequest,
        fetchConversations,
        fetchChatRequests,
    } = usePrivateChat({
        streamId: streamId === "homepage" ? "global" : streamId,
        receiverId: selectedPartnerId || undefined,
        token,
        enabled: streamId !== "homepage" && !!token,
        isModel, // Only fetch chat requests if user is the model
    });

    // Fetch stream model info (skip for homepage)
    useEffect(() => {
        const fetchModelInfo = async () => {
            console.log('[PrivateChatContainer] Fetching model info for streamId:', streamId);
            try {
                const response = await fetch(`/api/streams/${streamId}`);
                console.log('[PrivateChatContainer] Model info response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('[PrivateChatContainer] Model info data:', data);

                    const streamData = data?.stream ?? data;
                    const model = streamData?.model;

                    if (!model) {
                        console.warn("[PrivateChatContainer] No model info returned for stream", streamId);
                        return;
                    }

                    const modelData = {
                        id: model.id,
                        name: model.name || model.displayName || "Model",
                        image: model.avatar || model.avatarUrl || model.image
                    };

                    console.log('[PrivateChatContainer] Setting model info:', modelData);
                    setCreatorInfo(modelData);
                } else {
                    console.error('[PrivateChatContainer] Failed to fetch model info, status:', response.status);
                }
            } catch (error) {
                console.error("[PrivateChatContainer] Error fetching model info:", error);
            }
        };

        if (streamId && streamId !== "homepage") {
            fetchModelInfo();
        } else {
            console.log('[PrivateChatContainer] Skipping model info fetch for streamId:', streamId);
        }
    }, [streamId]);

    // Set initial partner when prop changes
    useEffect(() => {
        if (initialPartnerId && initialPartnerId !== selectedPartnerId) {
            setSelectedPartnerId(initialPartnerId);
        }
    }, [initialPartnerId, selectedPartnerId]);

    // Check request status with the model
    useEffect(() => {
        const checkCreatorRequestStatus = async () => {
            if (!creatorInfo || !token || session?.user?.id === creatorInfo.id) {
                return;
            }

            // Check if there's already a conversation
            const hasConversation = conversations.some(c => c.partnerId === creatorInfo.id);
            if (hasConversation) {
                setCreatorRequestStatus("ACCEPTED");
                return;
            }

            // Check for pending/rejected/expired request
            try {
                const response = await fetch(
                    `/api/streams/${streamId}/chat-requests/status?receiverId=${creatorInfo.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setCreatorRequestStatus(data.status || "NONE");
                } else {
                    setCreatorRequestStatus("NONE");
                }
            } catch (error) {
                console.error("Error checking request status:", error);
                setCreatorRequestStatus("NONE");
            }
        };

        checkCreatorRequestStatus();

        // Poll for status changes every 30 seconds (reduced from 5s to minimize API calls)
        const interval = setInterval(checkCreatorRequestStatus, 30000);

        return () => clearInterval(interval);
    }, [creatorInfo, conversations, token, streamId, session?.user?.id]);

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

    // Handle sending chat request
    const handleSendChatRequest = async (initialMessage?: string) => {
        if (!creatorInfo) return false;
        const success = await sendChatRequest(creatorInfo.id, initialMessage);
        if (success) {
            setCreatorRequestStatus("PENDING");
            setSelectedPartnerId(creatorInfo.id);
        }
        return success;
    };

    // Handle accepting chat request
    const handleAcceptRequest = async (requestId: string) => {
        const request = chatRequests.find(r => r.id === requestId);
        if (!request) return;

        const success = await acceptChatRequest(requestId);
        if (success) {
            // Update model request status if this is the model
            if (creatorInfo && request.senderId === creatorInfo.id) {
                setCreatorRequestStatus("ACCEPTED");
            }

            // Force refresh conversations and requests
            await fetchConversations(false);
            await fetchChatRequests();

            // Automatically select the conversation with the sender
            setSelectedPartnerId(request.senderId);
        }
    };

    // Handle rejecting chat request
    const handleRejectRequest = async (requestId: string) => {
        await rejectChatRequest(requestId);
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
                        Please sign in to use private chat and connect with models.
                    </p>
                </div>
            </Card>
        );
    }

    // Show loading if token is not yet available (waiting for chat token to be fetched)
    // Once token is available, rely on the hook's loading state
    const isWaitingForToken = !token && streamId !== "homepage";
    const isLoadingData = loading && conversations.length === 0 && chatRequests.length === 0;

    return (
        <Card className={cn("flex flex-col h-full bg-gray-900", className)}>
            {!selectedPartnerId ? (
                // Conversation list view
                <>
                    {isWaitingForToken || isLoadingData ? (
                        <div className="flex-1 flex items-center justify-center animate-in fade-in duration-300">
                            <div className="text-center p-6">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-400">
                                    {isWaitingForToken ? "Connecting..." : "Loading..."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto animate-in fade-in duration-300">
                            {/* Show pending chat requests for models */}
                            {creatorInfo && session?.user?.id === creatorInfo.id && chatRequests.length > 0 && (
                                <div className="p-3">
                                    <PrivateChatRequestNotification
                                        requests={chatRequests}
                                        onAccept={handleAcceptRequest}
                                        onReject={handleRejectRequest}
                                    />
                                </div>
                            )}

                            {/* Show "Message Model" option based on request status */}
                            {creatorInfo && session?.user?.id !== creatorInfo.id && (
                                <div className="p-3">
                                    {creatorRequestStatus === "NONE" && !conversations.find(c => c.partnerId === creatorInfo.id) && (
                                        <div className="mb-3">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start p-4 h-auto border-dashed border-purple-500/30 bg-gray-800/30 hover:bg-purple-600/10 hover:border-purple-400 text-white transition-all duration-200"
                                                onClick={() => setShowRequestDialog(true)}
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
                                                            Model • Send a chat request
                                                        </p>
                                                    </div>
                                                    <MessageCircle className="w-5 h-5 text-purple-400" />
                                                </div>
                                            </Button>
                                        </div>
                                    )}

                                    {creatorRequestStatus === "PENDING" && (
                                        <div className="mb-3">
                                            <div className="w-full p-4 border border-purple-500/30 bg-gray-800/30 rounded-lg">
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                                                            {creatorInfo.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 border-2 border-gray-800 animate-pulse" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-left text-white">
                                                            {creatorInfo.name}
                                                        </p>
                                                        <p className="text-xs text-yellow-300 text-left flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Request pending approval
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {creatorRequestStatus === "ACCEPTED" && !conversations.find(c => c.partnerId === creatorInfo.id) && (
                                        <div className="mb-3">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start p-4 h-auto border-green-500/30 bg-green-900/10 hover:bg-green-600/10 hover:border-green-400 text-white transition-all duration-200"
                                                onClick={() => setSelectedPartnerId(creatorInfo.id)}
                                            >
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                                                            {creatorInfo.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-gray-800" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-left text-white">
                                                            Chat with {creatorInfo.name}
                                                        </p>
                                                        <p className="text-xs text-green-300 text-left">
                                                            Request accepted • Start chatting
                                                        </p>
                                                    </div>
                                                    <MessageCircle className="w-5 h-5 text-green-400" />
                                                </div>
                                            </Button>
                                        </div>
                                    )}

                                    {(creatorRequestStatus === "REJECTED" || creatorRequestStatus === "EXPIRED") && (
                                        <div className="mb-3">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start p-4 h-auto border-dashed border-red-500/30 bg-gray-800/30 hover:bg-purple-600/10 hover:border-purple-400 text-white transition-all duration-200"
                                                onClick={() => setShowRequestDialog(true)}
                                            >
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                                                            {creatorInfo.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-400 border-2 border-gray-800" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-left text-white">
                                                            Message {creatorInfo.name}
                                                        </p>
                                                        <p className="text-xs text-red-300 text-left">
                                                            {creatorRequestStatus === "REJECTED" ? "Previous request declined" : "Request expired"} • Send new request
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

                            {/* Show available models for homepage */}
                            {streamId === "homepage" && conversations.length === 0 && (
                                <div className="p-4 text-center">
                                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="h-8 w-8 text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2 text-white">No Conversations Yet</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Start watching streams to chat with models privately.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                // Individual conversation view
                <>
                    {/* Back button overlay */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPartnerId(null)}
                        className="absolute top-2 left-2 z-10 h-8 w-8 p-0 hover:bg-gray-800/80 bg-gray-900/60 backdrop-blur-sm rounded-full"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    {/* Messages */}
                    <div
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto p-3 pt-12 min-h-0"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center h-full min-h-[200px]">
                                <div className="text-center p-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400">Loading messages...</p>
                                </div>
                            </div>
                        ) : requestStatus === "PENDING" ? (
                            <div className="flex items-center justify-center h-full min-h-[200px]">
                                <div className="text-center p-6 max-w-[240px]">
                                    <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-xs text-gray-400 mb-1">Request Pending</p>
                                    <p className="text-xs text-gray-600">Waiting for {selectedPartner?.partnerName || "model"} to accept</p>
                                </div>
                            </div>
                        ) : requestStatus === "REJECTED" ? (
                            <div className="flex items-center justify-center h-full min-h-[200px]">
                                <div className="text-center p-6 max-w-[240px]">
                                    <XCircle className="w-10 h-10 text-red-400/50 mx-auto mb-3" />
                                    <p className="text-xs text-gray-400 mb-1">Request Declined</p>
                                    <p className="text-xs text-gray-600 mb-4">Your chat request was declined</p>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowRequestDialog(true)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        Send New Request
                                    </Button>
                                </div>
                            </div>
                        ) : requestStatus === "EXPIRED" ? (
                            <div className="flex items-center justify-center h-full min-h-[200px]">
                                <div className="text-center p-6 max-w-[240px]">
                                    <Clock className="w-10 h-10 text-orange-400/50 mx-auto mb-3" />
                                    <p className="text-xs text-gray-400 mb-1">Request Expired</p>
                                    <p className="text-xs text-gray-600 mb-4">Request expired after 7 days</p>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowRequestDialog(true)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs"
                                    >
                                        Send New Request
                                    </Button>
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full min-h-[240px]">
                                <div className="text-center p-6 max-w-[280px] mx-auto">
                                    <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-purple-500/20">
                                        <MessageCircle className="w-10 h-10 text-purple-400" />
                                    </div>
                                    <p className="text-lg text-white mb-2 font-semibold">No messages yet</p>
                                    <p className="text-sm text-gray-300">Start the conversation!</p>
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
                    <form onSubmit={handleSendMessage} className="h-[120px] border-t border-gray-800/50 p-3 flex-shrink-0">
                        {error && (
                            <div className="text-xs text-red-400 bg-red-900/20 border border-red-500/30 p-2 rounded mb-2">
                                {error}
                            </div>
                        )}
                        <div className="flex gap-2 mb-2">
                            <Input
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type a message..."
                                disabled={sending || requestStatus === "PENDING" || requestStatus === "REJECTED" || requestStatus === "EXPIRED"}
                                maxLength={500}
                                className="flex-1 bg-gray-800/50 border-gray-700/50 text-white text-sm placeholder:text-gray-500 focus:border-purple-500/50 h-9"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!messageInput.trim() || sending || requestStatus === "PENDING" || requestStatus === "REJECTED" || requestStatus === "EXPIRED"}
                                className="bg-purple-600 hover:bg-purple-700 text-white h-9 w-9 p-0"
                            >
                                {sending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                        <div className="text-xs text-gray-500">
                            {messageInput.length}/500
                        </div>
                    </form>
                </>
            )}

            {/* Chat Request Dialog */}
            {creatorInfo && (
                <ChatRequestDialog
                    open={showRequestDialog}
                    onOpenChange={setShowRequestDialog}
                    modelName={creatorInfo.name}
                    onSendRequest={handleSendChatRequest}
                />
            )}
        </Card>
    );
}
