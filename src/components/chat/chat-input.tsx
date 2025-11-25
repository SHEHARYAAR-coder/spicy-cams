import React, { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Smile, Loader2, AlertCircle } from "lucide-react";

interface ChatInputProps {
    onSend: (message: string) => Promise<boolean>;
    disabled?: boolean;
    remaining: number | null;
    maxLength?: number;
}

export function ChatInput({
    onSend,
    disabled = false,
    remaining,
    maxLength = 500,
}: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [lastSendTime, setLastSendTime] = useState(0);

    const handleSend = async () => {
        if (!message.trim() || sending || disabled) return;

        // Debounce: prevent sending messages too quickly
        const now = Date.now();
        if (now - lastSendTime < 500) { // 500ms debounce
            return;
        }

        setSending(true);
        setLastSendTime(now);

        const success = await onSend(message.trim());

        if (success) {
            setMessage("");
        }

        setSending(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isApproachingLimit = remaining !== null && remaining < 3;
    const characterCount = message.length;
    const isOverLimit = characterCount > maxLength;

    return (
        <div className="h-full flex flex-col">
            {/* Warning area - fixed height */}
            <div className="h-7 px-3 sm:px-4 flex items-center">
                {isApproachingLimit && remaining !== null && (
                    <div className="flex items-center gap-1.5 text-xs text-orange-300 animate-pulse">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">Rate limit: {remaining} left</span>
                    </div>
                )}
            </div>

            {/* Input area */}
            <div className="flex-1 px-3 sm:px-4 pb-3">
                <div className="flex items-center gap-2 h-full">
                    {/* Emoji Button */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="hidden sm:flex h-9 w-9 flex-shrink-0 text-gray-400 hover:text-purple-400 hover:bg-gray-700/50"
                        disabled={disabled}
                        title="Emoji picker (coming soon)"
                    >
                        <Smile className="h-5 w-5" />
                    </Button>

                    {/* Message Input */}
                    <div className="flex-1 relative">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                disabled
                                    ? "Chat is disabled"
                                    : "Type a message... (Shift+Enter for new line)"
                            }
                            disabled={disabled || sending}
                            className="h-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 pr-16"
                            maxLength={maxLength}
                        />

                        {/* Character count */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none">
                            <span className={`${isOverLimit
                                    ? "text-red-400"
                                    : characterCount > maxLength * 0.8
                                        ? "text-orange-400"
                                        : "text-gray-500"
                                }`}>
                                {characterCount}/{maxLength}
                            </span>
                        </div>
                    </div>

                    {/* Send Button */}
                    <Button
                        onClick={handleSend}
                        disabled={disabled || sending || !message.trim() || isOverLimit}
                        className="h-9 w-9 flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25 disabled:bg-gray-700 disabled:shadow-none p-0"
                        size="icon"
                    >
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Helper text - fixed height */}
            <div className="h-6 px-3 sm:px-4 pb-2 flex items-center">
                <span className="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</span>
            </div>
        </div>
    );
}
