"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Coins, CreditCard, Check, ArrowRight } from "lucide-react";

interface CryptoPaymentDialogProps {
    planId: string;
    planName: string;
    amount: string;
    tokens: number;
    onClose: () => void;
}

export default function CryptoPaymentDialog({
    planId,
    planName,
    amount,
    tokens,
    onClose,
}: CryptoPaymentDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCryptoPayment = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/coinbase/create-charge", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ planId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create crypto charge");
            }

            // Redirect to Coinbase Commerce hosted checkout
            if (data.hostedUrl) {
                window.location.href = data.hostedUrl;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (err: unknown) {
            console.error("Crypto payment error:", err);
            const errorMessage =
                err instanceof Error ? err.message : "Something went wrong";
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 max-w-lg w-full">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Coins className="w-6 h-6 text-purple-400" />
                        Pay with Cryptocurrency
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Order Summary */}
                    <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Plan</span>
                            <span className="text-white font-medium">{planName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Tokens</span>
                            <span className="text-purple-400 font-medium">{tokens} tokens</span>
                        </div>
                        <div className="border-t border-gray-700 pt-3 flex justify-between">
                            <span className="text-white font-semibold">Total</span>
                            <span className="text-white font-bold text-lg">${amount} USD</span>
                        </div>
                    </div>

                    {/* Supported Cryptocurrencies */}
                    <div className="space-y-2">
                        <p className="text-sm text-gray-400">Accepted cryptocurrencies:</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-900/30 rounded-lg p-3 flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-gray-300">Bitcoin (BTC)</span>
                            </div>
                            <div className="bg-gray-900/30 rounded-lg p-3 flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-gray-300">Ethereum (ETH)</span>
                            </div>
                            <div className="bg-gray-900/30 rounded-lg p-3 flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-gray-300">Litecoin (LTC)</span>
                            </div>
                            <div className="bg-gray-900/30 rounded-lg p-3 flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-gray-300">USDC</span>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCryptoPayment}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Info Text */}
                    <p className="text-xs text-gray-500 text-center">
                        You will be redirected to Coinbase Commerce to complete your payment securely.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
