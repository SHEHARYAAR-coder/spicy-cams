"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, X, Loader2, Calculator, Wallet } from "lucide-react";

interface CustomTokenPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRICING_PLANS = {
    basic: {
        name: "Basic Plan",
        amount: 5,
        tokens: 10,
        description: "Perfect for getting started",
        popular: false,
        features: [
            "Access to all public streams",
            "Basic chat messaging",
            "Standard support",
        ],
    },
    plus: {
        name: "Plus Plan",
        amount: 15,
        tokens: 50,
        description: "Most Popular - Great value",
        popular: true,
        features: [
            "Everything in Basic",
            "Priority chat messages",
            "Tip models",
            "Access to premium features",
        ],
    },
    pro: {
        name: "Pro Plan",
        amount: 50,
        tokens: 200,
        description: "Ultimate experience",
        popular: false,
        features: [
            "Everything in Plus",
            "Private show access",
            "Premium support",
            "Exclusive content access",
        ],
    },
};

// Rate: $0.50 per token (same as Basic plan rate: $5 for 10 tokens)
const TOKEN_RATE = 0.50;
const MIN_TOKENS = 5;
const MAX_TOKENS = 1000;

export function CustomTokenPurchaseModal({ isOpen, onClose }: CustomTokenPurchaseModalProps) {
    const _router = useRouter();
    const [selectedMode, setSelectedMode] = useState<"preset" | "custom">("preset");
    const [selectedPlan, setSelectedPlan] = useState("plus");
    const [customTokens, setCustomTokens] = useState(25);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const customAmount = customTokens * TOKEN_RATE;

    const handlePlanPurchase = async (planId?: string) => {
        try {
            setIsLoading(true);

            let requestData;

            if (selectedMode === "custom") {
                // Create custom plan data
                requestData = {
                    planId: "custom",
                    customAmount: Math.round(customAmount * 100), // Convert to cents
                    customTokens: customTokens,
                };
            } else {
                requestData = { planId: planId || selectedPlan };
            }

            const response = await fetch("/api/stripe/create-checkout-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            const data = await response.json();

            if (response.ok && data.url) {
                // Redirect to Stripe checkout
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Failed to create checkout session");
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
            alert("Failed to start checkout process. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    const handleCustomTokenChange = (value: string) => {
        const numValue = parseInt(value) || 0;
        if (numValue >= 0 && numValue <= MAX_TOKENS) {
            setCustomTokens(numValue);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-gray-700/50">
                {/* Header */}
                <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Purchase Tokens</h2>
                        <p className="text-gray-400 mt-1">
                            Choose from preset plans or customize your token amount
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Mode Toggle */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="bg-gray-800/50 rounded-lg p-1 flex">
                            <Button
                                variant={selectedMode === "preset" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setSelectedMode("preset")}
                                className={selectedMode === "preset"
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-400 hover:text-white"
                                }
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Preset Plans
                            </Button>
                            <Button
                                variant={selectedMode === "custom" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setSelectedMode("custom")}
                                className={selectedMode === "custom"
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-400 hover:text-white"
                                }
                            >
                                <Calculator className="w-4 h-4 mr-2" />
                                Custom Amount
                            </Button>
                        </div>
                    </div>

                    {selectedMode === "preset" ? (
                        /* Preset Plans */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.entries(PRICING_PLANS).map(([planId, plan]) => (
                                <Card
                                    key={planId}
                                    onClick={() => setSelectedPlan(planId)}
                                    className={`cursor-pointer bg-gray-800/40 backdrop-blur-sm rounded-2xl overflow-hidden transition-all group relative ${selectedPlan === planId
                                            ? "border-purple-500/50 shadow-2xl shadow-purple-500/20 scale-105"
                                            : "border-gray-700/50 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10"
                                        } ${plan.popular ? "ring-2 ring-purple-500/50" : ""}`}
                                >
                                    {plan.popular && (
                                        <div className="absolute top-0 left-0 right-0">
                                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-semibold">
                                                Most Popular
                                            </div>
                                        </div>
                                    )}

                                    <CardHeader className={plan.popular ? "pt-12" : "pt-8"}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                                                    {planId === "basic" && <Sparkles className="w-5 h-5 text-purple-300" />}
                                                    {planId === "plus" && <Crown className="w-5 h-5 text-purple-300" />}
                                                    {planId === "pro" && <Crown className="w-5 h-5 text-purple-300" />}
                                                </div>
                                            </div>
                                            {plan.popular && (
                                                <Badge className="bg-purple-600 text-white">Popular</Badge>
                                            )}
                                        </div>

                                        <CardTitle className="text-white mb-2">{plan.name}</CardTitle>

                                        <div className="mb-2">
                                            <span className="text-4xl font-bold text-white">${plan.amount}</span>
                                            <span className="text-base text-gray-400 ml-2">USD</span>
                                        </div>

                                        <div className="text-sm text-gray-500 mb-6">
                                            <span className="text-purple-400 font-medium">{plan.tokens} tokens</span> included
                                        </div>

                                        <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                                    </CardHeader>

                                    <CardContent className="space-y-3 pb-8">
                                        {plan.features.map((feature, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                                                <span className="text-sm text-gray-300">{feature}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        /* Custom Amount Form */
                        <div className="max-w-lg mx-auto">
                            <Card className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                                <CardHeader>
                                    <CardTitle className="text-white text-center">
                                        <Calculator className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                                        Custom Token Amount
                                    </CardTitle>
                                    <p className="text-gray-400 text-center text-sm">
                                        Choose exactly how many tokens you need
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Token Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Number of Tokens
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min={MIN_TOKENS}
                                                max={MAX_TOKENS}
                                                value={customTokens}
                                                onChange={(e) => handleCustomTokenChange(e.target.value)}
                                                className="bg-gray-700/50 border-gray-600 text-white text-lg font-semibold text-center pr-16"
                                                placeholder="Enter amount"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <span className="text-purple-400 font-medium text-sm">tokens</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Min: {MIN_TOKENS} tokens</span>
                                            <span>Max: {MAX_TOKENS} tokens</span>
                                        </div>
                                    </div>

                                    {/* Quick Amount Buttons */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {[25, 50, 100, 250].map((amount) => (
                                            <Button
                                                key={amount}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCustomTokens(amount)}
                                                className={`border-gray-600 text-gray-300 hover:border-purple-500 hover:text-purple-300 ${customTokens === amount ? 'border-purple-500 text-purple-300 bg-purple-500/10' : ''
                                                    }`}
                                            >
                                                {amount}
                                            </Button>
                                        ))}
                                    </div>

                                    {/* Price Display */}
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-300">Total Cost:</span>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-white">
                                                    ${customAmount.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    ${TOKEN_RATE.toFixed(2)} per token
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Purchase Button */}
                    <div className="mt-8 flex justify-center">
                        <Button
                            onClick={() => handlePlanPurchase()}
                            disabled={isLoading || (selectedMode === "custom" && customTokens < MIN_TOKENS)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/20 transition-all min-w-[200px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Wallet className="w-5 h-5 mr-2" />
                                    {selectedMode === "preset"
                                        ? `Purchase ${PRICING_PLANS[selectedPlan as keyof typeof PRICING_PLANS].tokens} Tokens`
                                        : `Purchase ${customTokens} Tokens`
                                    }
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            🔒 Secure payment powered by Stripe. Your payment information is protected and encrypted.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}