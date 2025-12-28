"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Heart, Gift, Gamepad2, Zap } from "lucide-react";

interface TipActivity {
    icon: string;
    name: string;
    tokens: number;
}

interface TipMenuDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTip: (tokens: number, activity?: string) => void;
}

const TIP_ACTIVITIES: TipActivity[] = [
    { icon: "💋", name: "Blow kiss", tokens: 2 },
    { icon: "😊", name: "PM", tokens: 66 },
    { icon: "🎵", name: "Song request", tokens: 141 },
    { icon: "💄", name: "Lip bite", tokens: 4 },
    { icon: "🦶", name: "Sole tease", tokens: 151 },
    { icon: "🍒", name: "Cherrycopter", tokens: 122 },
    { icon: "💗", name: "Naughty whisper", tokens: 50 },
    { icon: "👅", name: "tongue out 👅", tokens: 42 },
    { icon: "💇", name: "Hair play", tokens: 19 },
    { icon: "😈", name: "control lush 3 min 😈", tokens: 500 },
    { icon: "📱", name: "my social media TG", tokens: 444 },
    { icon: "📸", name: "Snap", tokens: 454 },
    { icon: "🌹", name: "gift me flowers", tokens: 11 },
    { icon: "❤️", name: "keep going ! I like it", tokens: 25 },
];

const QUICK_TIP_AMOUNTS = [20, 50, 100, 200, 300, 500];

export function TipMenuDialog({ open, onOpenChange, onTip }: TipMenuDialogProps) {
    const [activeTab, setActiveTab] = useState<"tip" | "toy" | "games">("tip");
    const [customAmount, setCustomAmount] = useState<string>("20");

    const handleTipActivity = (activity: TipActivity) => {
        onTip(activity.tokens, activity.name);
        // Don't close dialog automatically - let user tip multiple times
    };

    const handleQuickTip = (amount: number) => {
        onTip(amount);
    };

    const handleCustomTip = () => {
        const amount = parseInt(customAmount);
        if (amount && amount > 0) {
            onTip(amount);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] bg-gray-900 border-gray-700 text-white p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">Send Tip</DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        <Button
                            variant={activeTab === "tip" ? "default" : "ghost"}
                            onClick={() => setActiveTab("tip")}
                            className={`flex-1 ${activeTab === "tip"
                                    ? "bg-gray-700 text-white"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                                }`}
                        >
                            <Heart className="w-4 h-4 mr-2" />
                            Tip Menu
                        </Button>
                        <Button
                            variant={activeTab === "toy" ? "default" : "ghost"}
                            onClick={() => setActiveTab("toy")}
                            className={`flex-1 ${activeTab === "toy"
                                    ? "bg-gray-700 text-white"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                                }`}
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            Sex Toy
                        </Button>
                        <Button
                            variant={activeTab === "games" ? "default" : "ghost"}
                            onClick={() => setActiveTab("games")}
                            className={`flex-1 ${activeTab === "games"
                                    ? "bg-gray-700 text-white"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                                }`}
                        >
                            <Gamepad2 className="w-4 h-4 mr-2" />
                            Games & Fun
                        </Button>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === "tip" && (
                        <div className="h-[400px] overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                            {/* Activity Header */}
                            <div className="flex items-center justify-between mb-4 text-xs font-semibold text-gray-400 uppercase">
                                <span>Activity</span>
                                <span>Tokens</span>
                            </div>

                            {/* Activities List */}
                            <div className="space-y-2 mb-6">
                                {TIP_ACTIVITIES.map((activity, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleTipActivity(activity)}
                                        className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-purple-500/50 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{activity.icon}</span>
                                            <span className="text-sm text-gray-300 group-hover:text-white">
                                                {activity.name}
                                            </span>
                                        </div>
                                        <span className="text-sm font-semibold text-purple-400">
                                            {activity.tokens}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "toy" && (
                        <div className="h-[400px] px-6 py-4 flex items-center justify-center">
                            <div className="text-center text-gray-400">
                                <Zap className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                                <p className="text-sm">Sex toy controls coming soon</p>
                            </div>
                        </div>
                    )}

                    {activeTab === "games" && (
                        <div className="h-[400px] px-6 py-4 flex items-center justify-center">
                            <div className="text-center text-gray-400">
                                <Gamepad2 className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                                <p className="text-sm">Games & fun activities coming soon</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - Quick Tip Amounts */}
                <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {QUICK_TIP_AMOUNTS.map((amount) => (
                            <Button
                                key={amount}
                                onClick={() => handleQuickTip(amount)}
                                variant="outline"
                                className="flex-1 min-w-[80px] bg-gray-700 border-gray-600 hover:bg-purple-600 hover:border-purple-600 text-white"
                            >
                                {amount}
                            </Button>
                        ))}
                    </div>

                    {/* Custom Amount */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 mb-1 block">Custom amount:</label>
                            <Input
                                type="number"
                                min="1"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="Enter amount"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={handleCustomTip}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                            >
                                Buy Tokens
                            </Button>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                        <Gift className="inline w-3 h-3 mr-1" />
                        You need <span className="text-purple-400 font-semibold">more tokens</span>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
