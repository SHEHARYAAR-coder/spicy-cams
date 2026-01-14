"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, X, Loader2 } from "lucide-react";

interface TokenPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    isNewUser?: boolean;
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

export function TokenPurchaseModal({ isOpen, onClose, isNewUser = false }: TokenPurchaseModalProps) {
    const _router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState("plus");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handlePlanPurchase = async (planId: string) => {
        try {
            setIsLoading(true);

            const response = await fetch("/api/stripe/create-checkout-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ planId }),
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
            // You could add a toast notification here
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

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50">
                {/* Header */}
                <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {isNewUser ? "Choose Your Starting Plan" : "Purchase Tokens"}
                        </h2>
                        <p className="text-gray-400 mt-1">
                            {isNewUser
                                ? "Select a plan to get started on SpicyCams"
                                : "Top up your balance to continue enjoying our features"
                            }
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
                    {/* New User Welcome Message */}
                    {isNewUser && (
                        <div className="mb-8 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                <h3 className="font-semibold text-white">Welcome to SpicyCams!</h3>
                            </div>
                            <p className="text-sm text-gray-300">
                                To enjoy live streams, private messaging, and exclusive content, you&apos;ll need tokens.
                                Choose a plan that suits your needs - you can always upgrade later!
                            </p>
                        </div>
                    )}

                    {/* Pricing Plans */}
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

                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlanPurchase(planId);
                                        }}
                                        disabled={isLoading}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 font-semibold shadow-lg shadow-purple-500/20 transition-all group-hover:shadow-purple-500/30 disabled:opacity-50"
                                    >
                                        {isLoading && selectedPlan === planId ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>Get {plan.name}</>
                                        )}
                                    </Button>
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

                    {/* Usage Information */}
                    <div className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            How tokens are used
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Live stream viewing</span>
                                    <span className="text-purple-400 font-medium">5 tokens/min</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Private messages</span>
                                    <span className="text-purple-400 font-medium">1-3 tokens</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Tips to models</span>
                                    <span className="text-purple-400 font-medium">Custom amount</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Private shows</span>
                                    <span className="text-purple-400 font-medium">Varies</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            🔒 Secure payment powered by Stripe. Your payment information is protected and encrypted.
                        </p>
                        {!isNewUser && (
                            <p className="text-xs text-gray-500 mt-2">
                                You can close this modal and purchase tokens later from the pricing page.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}