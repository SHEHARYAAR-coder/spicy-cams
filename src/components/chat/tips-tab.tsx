"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Gift, Gamepad2, Zap, Loader2 } from "lucide-react";

interface TipActivity {
    id?: string;
    icon: string;
    name: string;
    tokens: number;
    category?: string;
}

interface TipsTabProps {
    onTip: (tokens: number, activity?: string) => void;
    className?: string;
    modelId: string;
}

const DEFAULT_TIP_ACTIVITIES: TipActivity[] = [
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

export function TipsTab({ onTip, className, modelId }: TipsTabProps) {
    const [activeSubTab, setActiveSubTab] = useState<"tip" | "toy" | "games">("tip");
    const [customAmount, setCustomAmount] = useState<string>("20");
    const [tipActivities, setTipActivities] = useState<TipActivity[]>(DEFAULT_TIP_ACTIVITIES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModelTipMenu();
    }, [modelId]);

    const fetchModelTipMenu = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/tip-menu?modelId=${modelId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    setTipActivities(data.items);
                } else {
                    // Use default items if model hasn't set up custom menu
                    setTipActivities(DEFAULT_TIP_ACTIVITIES);
                }
            } else {
                setTipActivities(DEFAULT_TIP_ACTIVITIES);
            }
        } catch (error) {
            console.error("Error fetching tip menu:", error);
            setTipActivities(DEFAULT_TIP_ACTIVITIES);
        } finally {
            setLoading(false);
        }
    };

    const handleTipActivity = (activity: TipActivity) => {
        onTip(activity.tokens, activity.name);
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

    const getCategoryActivities = (category: string) => {
        return tipActivities.filter(
            (activity) => (activity.category || "tip") === category
        );
    };

    return (
        <div className={`flex flex-col h-full bg-gray-900 ${className || ''}`}>
            {/* Sub-tabs */}
            <div className="flex-shrink-0 px-3 sm:px-4 pt-3 pb-2 border-b border-gray-700/50">
                <div className="flex gap-2">
                    <Button
                        variant={activeSubTab === "tip" ? "default" : "ghost"}
                        onClick={() => setActiveSubTab("tip")}
                        size="sm"
                        className={`flex-1 ${activeSubTab === "tip"
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                            }`}
                    >
                        <Heart className="w-4 h-4 mr-2" />
                        Tip Menu
                    </Button>
                    <Button
                        variant={activeSubTab === "toy" ? "default" : "ghost"}
                        onClick={() => setActiveSubTab("toy")}
                        size="sm"
                        className={`flex-1 ${activeSubTab === "toy"
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                            }`}
                    >
                        <Zap className="w-4 h-4 mr-2" />
                        Sex Toy
                    </Button>
                    <Button
                        variant={activeSubTab === "games" ? "default" : "ghost"}
                        onClick={() => setActiveSubTab("games")}
                        size="sm"
                        className={`flex-1 ${activeSubTab === "games"
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                            }`}
                    >
                        <Gamepad2 className="w-4 h-4 mr-2" />
                        Games & Fun
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                    </div>
                ) : (
                    <>
                        {activeSubTab === "tip" && (
                            <div className="h-full overflow-y-auto px-3 sm:px-4 py-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                {/* Activity Header */}
                                <div className="flex items-center justify-between mb-3 text-xs font-semibold text-gray-400 uppercase">
                                    <span>Activity</span>
                                    <span>Tokens</span>
                                </div>

                                {/* Activities List */}
                                <div className="space-y-2 mb-4">
                                    {getCategoryActivities("tip").map((activity, index) => (
                                        <button
                                            key={activity.id || index}
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

                        {activeSubTab === "toy" && (
                            <div className="h-full px-3 sm:px-4 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                {getCategoryActivities("toy").length > 0 ? (
                                    <div className="space-y-2">
                                        {getCategoryActivities("toy").map((activity, index) => (
                                            <button
                                                key={activity.id || index}
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
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-gray-400">
                                            <Zap className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                                            <p className="text-sm">No sex toy controls available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSubTab === "games" && (
                            <div className="h-full px-3 sm:px-4 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                {getCategoryActivities("games").length > 0 ? (
                                    <div className="space-y-2">
                                        {getCategoryActivities("games").map((activity, index) => (
                                            <button
                                                key={activity.id || index}
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
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-gray-400">
                                            <Gamepad2 className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                                            <p className="text-sm">No games & fun activities available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>            {/* Footer - Quick Tip Amounts */}
            <div className="flex-shrink-0 px-3 sm:px-4 py-3 border-t border-gray-700 bg-gray-800/50">
                <div className="flex flex-wrap gap-2 mb-3">
                    {QUICK_TIP_AMOUNTS.map((amount) => (
                        <Button
                            key={amount}
                            onClick={() => handleQuickTip(amount)}
                            variant="outline"
                            size="sm"
                            className="flex-1 min-w-[70px] bg-gray-700 border-gray-600 hover:bg-purple-600 hover:border-purple-600 text-white"
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
                            className="h-9 bg-gray-700 border-gray-600 text-white text-sm"
                            placeholder="Enter amount"
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={handleCustomTip}
                            size="sm"
                            className="h-9 bg-purple-600 hover:bg-purple-700 text-white px-6"
                        >
                            Send Tip
                        </Button>
                    </div>
                </div>

                <p className="text-xs text-gray-500 mt-3 text-center">
                    <Gift className="inline w-3 h-3 mr-1" />
                    You need <span className="text-purple-400 font-semibold">more tokens</span>
                </p>
            </div>
        </div>
    );
}
