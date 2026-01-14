"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LowBalanceNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    balance: number;
    isNewUser?: boolean;
    onBuyTokens: () => void;
}

export function LowBalanceNotification({
    isOpen,
    onClose,
    balance,
    isNewUser = false,
    onBuyTokens,
}: LowBalanceNotificationProps) {
    const [shouldShow, setShouldShow] = useState(isOpen);

    useEffect(() => {
        setShouldShow(isOpen);
    }, [isOpen]);

    if (!shouldShow) return null;

    const handleClose = () => {
        setShouldShow(false);
        onClose();
    };

    const handleBuyTokens = () => {
        onBuyTokens();
        handleClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="bg-gray-900/95 border-yellow-500/50 shadow-2xl max-w-md w-full mx-auto">
                <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/20 rounded-full">
                                {isNewUser ? (
                                    <Wallet className="w-6 h-6 text-yellow-500" />
                                ) : (
                                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {isNewUser ? "Welcome to SpicyCams!" : "Low Balance Alert"}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    {isNewUser
                                        ? "Get started with tokens"
                                        : "Your balance is running low"}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Balance Display */}
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Current Balance:</span>
                            <div className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-purple-400" />
                                <span className={`font-semibold ${balance < 10 ? "text-red-400" : balance < 50 ? "text-yellow-400" : "text-green-400"
                                    }`}>
                                    {balance.toFixed(0)} tokens
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="mb-6">
                        {isNewUser ? (
                            <div className="space-y-3">
                                <p className="text-gray-300 text-sm">
                                    Welcome to SpicyCams! You currently have {balance.toFixed(0)} tokens.
                                    To enjoy all our features including live streams, private messages, and exclusive content,
                                    you&apos;ll need more tokens.
                                </p>
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                                    <p className="text-purple-300 text-xs font-medium">
                                        💡 Tip: Start with our Basic plan (10 tokens) for just $5 to explore the platform!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-gray-300 text-sm">
                                    Your token balance is below 100 tokens. You might experience interruptions while:
                                </p>
                                <ul className="text-gray-400 text-xs space-y-1 ml-4">
                                    <li>• Watching live streams (5 tokens/minute)</li>
                                    <li>• Sending private messages (1-3 tokens/message)</li>
                                    <li>• Sending tips to models</li>
                                    <li>• Accessing premium features</li>
                                </ul>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                    <p className="text-yellow-300 text-xs font-medium">
                                        ⚠️ Recommended: Keep at least 100 tokens for uninterrupted viewing
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={handleBuyTokens}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Wallet className="w-4 h-4 mr-2" />
                            Buy Tokens Now
                        </Button>
                        {!isNewUser && (
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="flex-1 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
                            >
                                Remind Me Later
                            </Button>
                        )}
                    </div>

                    {/* Footer note */}
                    <p className="text-xs text-gray-500 text-center mt-4">
                        {isNewUser
                            ? "You can always purchase tokens later from the pricing page"
                            : "This notification appears when your balance drops below 100 tokens"
                        }
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}