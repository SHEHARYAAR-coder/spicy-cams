import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Loader2 } from "lucide-react";

interface ChatRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    modelName: string;
    onSendRequest: (initialMessage?: string) => Promise<boolean>;
}

export function ChatRequestDialog({
    open,
    onOpenChange,
    modelName,
    onSendRequest,
}: ChatRequestDialogProps) {
    const [initialMessage, setInitialMessage] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        const success = await onSendRequest(initialMessage.trim() || undefined);
        setSending(false);

        if (success) {
            setInitialMessage("");
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl text-white">
                                Send Chat Request
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Request to chat privately with {modelName}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                        <p className="text-sm text-purple-200 leading-relaxed">
                            <strong className="text-purple-300">Note:</strong> The model
                            will receive your request and can choose to accept or decline it.
                            You&apos;ll be notified once they respond.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                            Initial Message (Optional)
                        </label>
                        <Textarea
                            value={initialMessage}
                            onChange={(e) => setInitialMessage(e.target.value)}
                            placeholder={`Introduce yourself to ${modelName}...`}
                            maxLength={300}
                            rows={4}
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 resize-none"
                            disabled={sending}
                        />
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">
                                This message will be sent with your request
                            </span>
                            <span
                                className={`${initialMessage.length > 250
                                    ? "text-orange-400"
                                    : "text-gray-500"
                                    }`}
                            >
                                {initialMessage.length}/300
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={sending}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={sending}
                        className="bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg shadow-purple-600/25"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Send Request
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
