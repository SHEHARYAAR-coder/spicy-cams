import React, { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Smile, Loader2 } from "lucide-react";

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

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isApproachingLimit = remaining !== null && remaining < 3;
    const characterCount = message.length;
    const isOverLimit = characterCount > maxLength;

    return (
        <div className="border-t border-gray-700 p-4 bg-gray-800/50 backdrop-blur-sm">
            {/* Rate limit warning */}
            {isApproachingLimit && remaining !== null && (
                <div className="mb-3 text-sm text-orange-300 bg-orange-900/20 border border-orange-500/30 p-3 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                        <span>Rate limit warning: {remaining} messages remaining</span>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                {/* Emoji Picker Button (placeholder) */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-gray-400 hover:text-purple-400 hover:bg-gray-700/50 transition-colors"
                    disabled={disabled}
                    title="Emoji picker (coming soon)"
                >
                    <Smile className="h-5 w-5" />
                </Button>

                {/* Message Input */}
                <div className="flex-1">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            disabled
                                ? "Chat is disabled"
                                : "Type a message... (Shift+Enter for new line)"
                        }
                        disabled={disabled || sending}
                        className="min-h-[60px] max-h-[120px] resize-none bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 backdrop-blur-sm"
                        maxLength={maxLength + 50} // Soft limit
                    />

                    {/* Character count */}
                    <div className="text-xs text-right mt-2">
                        <span className={`px-2 py-1 rounded ${isOverLimit
                                ? "text-red-400 bg-red-900/20"
                                : characterCount > maxLength * 0.8
                                    ? "text-orange-400 bg-orange-900/20"
                                    : "text-gray-400"
                            }`}>
                            {characterCount} / {maxLength}
                        </span>
                    </div>
                </div>

                {/* Send Button */}
                <Button
                    onClick={handleSend}
                    disabled={disabled || sending || !message.trim() || isOverLimit}
                    className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg shadow-purple-600/25 transition-all duration-200 disabled:bg-gray-700 disabled:shadow-none"
                    size="icon"
                >
                    {sending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </div>

            {/* Enter to send hint */}
            <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent"></div>
            </div>
        </div>
    );
}
