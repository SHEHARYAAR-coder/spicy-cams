"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useInbox } from "@/hooks/use-inbox";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ArrowLeft, Send, MessageCircle, Inbox as InboxIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InboxPage() {
    const { data: session } = useSession();
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [chatToken, setChatToken] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Fetch JWT token from API for authentication
    useEffect(() => {
        const fetchToken = async () => {
            if (session?.user?.id) {
                try {
                    const response = await fetch("/api/inbox/token");
                    if (response.ok) {
                        const data = await response.json();
                        setChatToken(data.token);
                    }
                } catch (error) {
                    console.error("Error fetching inbox token:", error);
                }
            }
        };
        fetchToken();
    }, [session]); const {
        messages,
        conversations,
        loading,
        error,
        sending,
        sendMessage,
    } = useInbox({
        partnerId: selectedPartnerId || undefined,
        token: chatToken,
        enabled: !!chatToken,
    });

    const selectedPartner = conversations.find(c => c.partnerId === selectedPartnerId);

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedPartnerId || sending) return;

        const success = await sendMessage(messageInput, selectedPartnerId);
        if (success) {
            setMessageInput("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
                <Card className="p-8 bg-gray-800/50 border-gray-700">
                    <p className="text-white">Please sign in to access your inbox</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <InboxIcon className="w-8 h-8" />
                        Inbox
                    </h1>
                    <p className="text-gray-400 mt-2">Manage all your private conversations</p>
                </div>

                <Card className="bg-gray-800/50 border-gray-700 overflow-hidden">
                    <div className="flex h-[calc(100vh-200px)]">
                        {/* Conversations List */}
                        <div className={cn(
                            "w-full md:w-80 border-r border-gray-700 flex flex-col",
                            selectedPartnerId && "hidden md:flex"
                        )}>
                            <div className="p-4 border-b border-gray-700">
                                <h2 className="text-lg font-semibold text-white">Conversations</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {loading && conversations.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center p-6">
                                            <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                                            <p className="text-xs text-gray-400">Loading conversations...</p>
                                        </div>
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                        <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
                                        <p className="text-gray-400 mb-1">No conversations yet</p>
                                        <p className="text-sm text-gray-500">Start chatting with models to see your conversations here</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-700">
                                        {conversations.map((conversation) => (
                                            <button
                                                key={conversation.partnerId}
                                                onClick={() => setSelectedPartnerId(conversation.partnerId)}
                                                className={cn(
                                                    "w-full p-4 flex items-start gap-3 hover:bg-gray-700/50 transition-colors text-left",
                                                    selectedPartnerId === conversation.partnerId && "bg-gray-700/50"
                                                )}
                                            >
                                                <Avatar className="w-10 h-10 flex-shrink-0">
                                                    <AvatarImage src={conversation.partnerImage} />
                                                    <AvatarFallback className="bg-purple-600">
                                                        {conversation.partnerName[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-semibold text-white truncate">
                                                            {conversation.partnerName}
                                                        </p>
                                                        {conversation.unreadCount > 0 && (
                                                            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                                                                {conversation.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(conversation.lastMessageAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className={cn(
                            "flex-1 flex flex-col",
                            !selectedPartnerId && "hidden md:flex"
                        )}>
                            {!selectedPartnerId ? (
                                <div className="flex-1 flex items-center justify-center p-6">
                                    <div className="text-center">
                                        <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <p className="text-xl text-gray-400 mb-2">Select a conversation</p>
                                        <p className="text-sm text-gray-500">Choose a conversation from the list to start messaging</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-700 flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedPartnerId(null)}
                                            className="md:hidden"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>

                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={selectedPartner?.partnerImage} />
                                            <AvatarFallback className="bg-purple-600">
                                                {selectedPartner?.partnerName[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <p className="font-semibold text-white">{selectedPartner?.partnerName}</p>
                                            <p className="text-xs text-gray-400">{selectedPartner?.partnerRole}</p>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div
                                        ref={messagesContainerRef}
                                        className="flex-1 overflow-y-auto p-4 space-y-4"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="text-center p-6">
                                                    <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                                                    <p className="text-xs text-gray-400">Loading messages...</p>
                                                </div>
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="text-center">
                                                    <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                                    <p className="text-lg text-white mb-2 font-semibold">No messages yet</p>
                                                    <p className="text-sm text-gray-300">Start the conversation!</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {messages.map((message) => {
                                                    const isOwnMessage = message.senderId === session?.user?.id;
                                                    return (
                                                        <div
                                                            key={message.id}
                                                            className={cn(
                                                                "flex gap-3",
                                                                isOwnMessage ? "flex-row-reverse" : "flex-row"
                                                            )}
                                                        >
                                                            <Avatar className="w-8 h-8 flex-shrink-0">
                                                                <AvatarImage src={message.sender.image} />
                                                                <AvatarFallback className="bg-purple-600 text-xs">
                                                                    {message.sender.name[0]?.toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>

                                                            <div
                                                                className={cn(
                                                                    "max-w-[70%] rounded-lg px-4 py-2",
                                                                    isOwnMessage
                                                                        ? "bg-purple-600 text-white"
                                                                        : "bg-gray-700 text-white"
                                                                )}
                                                            >
                                                                <p className="text-sm break-words">{message.message}</p>
                                                                <p className="text-xs opacity-70 mt-1">
                                                                    {new Date(message.createdAt).toLocaleTimeString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </>
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-gray-700">
                                        {error && (
                                            <p className="text-red-400 text-sm mb-2">{error}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <Input
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Type a message..."
                                                className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                                                disabled={sending}
                                            />
                                            <Button
                                                onClick={handleSendMessage}
                                                disabled={!messageInput.trim() || sending}
                                                className="bg-purple-600 hover:bg-purple-700"
                                            >
                                                {sending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
