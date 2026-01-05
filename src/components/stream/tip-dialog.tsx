"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Zap, Gamepad2, Gift, Loader2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TipActivity {
    id?: string;
    icon: string;
    name: string;
    tokens: number;
    category?: string;
}

interface TipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    modelId: string;
    modelName?: string;
    onTip: (tokens: number, activity?: string) => void;
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

export function TipDialog({
    open,
    onOpenChange,
    modelId,
    modelName,
    onTip,
}: TipDialogProps) {
    const [activeSubTab, setActiveSubTab] = useState<"tip" | "toy" | "games">("tip");
    const [customAmount, setCustomAmount] = useState<string>("20");
    const [tipActivities, setTipActivities] = useState<TipActivity[]>(DEFAULT_TIP_ACTIVITIES);
    const [loading, setLoading] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState<TipActivity | null>(null);

    // Reset selected activity when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setSelectedActivity(null);
        }
    }, [open]);

    useEffect(() => {
        if (open && modelId) {
            fetchModelTipMenu();
        }
    }, [modelId, open]);

    const fetchModelTipMenu = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/tip-menu?modelId=${modelId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    setTipActivities(data.items);
                } else {
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

    // Select an activity (don't send yet)
    const handleSelectActivity = (activity: TipActivity) => {
        setSelectedActivity(activity);
        // Update custom amount to show selected activity's tokens
        setCustomAmount(activity.tokens.toString());
    };

    // Send the selected activity tip
    const handleSendSelectedTip = () => {
        if (selectedActivity) {
            onTip(selectedActivity.tokens, selectedActivity.name);
            setSelectedActivity(null);
            onOpenChange(false);
        }
    };

    const handleQuickTip = (amount: number) => {
        setSelectedActivity(null);
        setCustomAmount(amount.toString());
    };

    const handleCustomTip = () => {
        const amount = parseInt(customAmount);
        if (amount && amount > 0) {
            onTip(amount, selectedActivity?.name);
            setSelectedActivity(null);
            onOpenChange(false);
        }
    };

    const getCategoryActivities = (category: string) => {
        return tipActivities.filter(
            (activity) => (activity.category || "tip") === category
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
                {/* Header */}
                <DialogHeader className="px-4 pt-4 pb-3 border-b border-gray-700/50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold">
                            {modelName ? `Tip ${modelName}` : "Send Tip"}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                {/* Sub-tabs */}
                <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-gray-700/50">
                    <div className="flex gap-2">
                        <Button
                            variant={activeSubTab === "tip" ? "default" : "ghost"}
                            onClick={() => setActiveSubTab("tip")}
                            size="sm"
                            className={cn(
                                "flex-1",
                                activeSubTab === "tip"
                                    ? "bg-purple-600 text-white hover:bg-purple-700"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                            )}
                        >
                            <Heart className="w-4 h-4 mr-2" />
                            Tip Menu
                        </Button>
                        <Button
                            variant={activeSubTab === "toy" ? "default" : "ghost"}
                            onClick={() => setActiveSubTab("toy")}
                            size="sm"
                            className={cn(
                                "flex-1",
                                activeSubTab === "toy"
                                    ? "bg-purple-600 text-white hover:bg-purple-700"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                            )}
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            Sex Toy
                        </Button>
                        <Button
                            variant={activeSubTab === "games" ? "default" : "ghost"}
                            onClick={() => setActiveSubTab("games")}
                            size="sm"
                            className={cn(
                                "flex-1",
                                activeSubTab === "games"
                                    ? "bg-purple-600 text-white hover:bg-purple-700"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                            )}
                        >
                            <Gamepad2 className="w-4 h-4 mr-2" />
                            Games & Fun
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden min-h-0">
                    {loading ? (
                        <div className="h-full flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                        </div>
                    ) : (
                        <>
                            {activeSubTab === "tip" && (
                                <div className="h-full overflow-y-auto px-4 py-3 max-h-[300px]">
                                    {/* Activity Header */}
                                    <div className="flex items-center justify-between mb-3 text-xs font-semibold text-gray-400 uppercase">
                                        <span>Activity</span>
                                        <span>Tokens</span>
                                    </div>

                                    {/* Activities List */}
                                    <div className="space-y-2">
                                        {getCategoryActivities("tip").map((activity, index) => (
                                            <button
                                                key={activity.id || index}
                                                onClick={() => handleSelectActivity(activity)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 rounded-lg border transition-all group",
                                                    selectedActivity?.name === activity.name
                                                        ? "bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/50"
                                                        : "bg-gray-800/50 hover:bg-gray-800 border-gray-700 hover:border-purple-500/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {selectedActivity?.name === activity.name && (
                                                        <Check className="w-4 h-4 text-purple-400" />
                                                    )}
                                                    <span className="text-2xl">{activity.icon}</span>
                                                    <span className={cn(
                                                        "text-sm",
                                                        selectedActivity?.name === activity.name
                                                            ? "text-white font-medium"
                                                            : "text-gray-300 group-hover:text-white"
                                                    )}>
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
                                <div className="h-full px-4 py-4 overflow-y-auto max-h-[300px]">
                                    {getCategoryActivities("toy").length > 0 ? (
                                        <div className="space-y-2">
                                            {getCategoryActivities("toy").map((activity, index) => (
                                                <button
                                                    key={activity.id || index}
                                                    onClick={() => handleSelectActivity(activity)}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 rounded-lg border transition-all group",
                                                        selectedActivity?.name === activity.name
                                                            ? "bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/50"
                                                            : "bg-gray-800/50 hover:bg-gray-800 border-gray-700 hover:border-purple-500/50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {selectedActivity?.name === activity.name && (
                                                            <Check className="w-4 h-4 text-purple-400" />
                                                        )}
                                                        <span className="text-2xl">{activity.icon}</span>
                                                        <span className={cn(
                                                            "text-sm",
                                                            selectedActivity?.name === activity.name
                                                                ? "text-white font-medium"
                                                                : "text-gray-300 group-hover:text-white"
                                                        )}>
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
                                        <div className="flex items-center justify-center h-full py-12">
                                            <div className="text-center text-gray-400">
                                                <Zap className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                                                <p className="text-sm">No sex toy controls available</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSubTab === "games" && (
                                <div className="h-full px-4 py-4 overflow-y-auto max-h-[300px]">
                                    {getCategoryActivities("games").length > 0 ? (
                                        <div className="space-y-2">
                                            {getCategoryActivities("games").map((activity, index) => (
                                                <button
                                                    key={activity.id || index}
                                                    onClick={() => handleSelectActivity(activity)}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 rounded-lg border transition-all group",
                                                        selectedActivity?.name === activity.name
                                                            ? "bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/50"
                                                            : "bg-gray-800/50 hover:bg-gray-800 border-gray-700 hover:border-purple-500/50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {selectedActivity?.name === activity.name && (
                                                            <Check className="w-4 h-4 text-purple-400" />
                                                        )}
                                                        <span className="text-2xl">{activity.icon}</span>
                                                        <span className={cn(
                                                            "text-sm",
                                                            selectedActivity?.name === activity.name
                                                                ? "text-white font-medium"
                                                                : "text-gray-300 group-hover:text-white"
                                                        )}>
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
                                        <div className="flex items-center justify-center h-full py-12">
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
                </div>

                {/* Footer - Quick Tip Amounts */}
                <div className="flex-shrink-0 px-4 py-4 border-t border-gray-700 bg-gray-800/50">
                    {/* Selected Activity Display */}
                    {selectedActivity && (
                        <div className="mb-3 p-3 rounded-lg bg-purple-600/20 border border-purple-500/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{selectedActivity.icon}</span>
                                <span className="text-sm text-white font-medium">{selectedActivity.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-purple-400">{selectedActivity.tokens} Tk</span>
                                <button 
                                    onClick={() => setSelectedActivity(null)}
                                    className="text-gray-400 hover:text-white p-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick Tip Buttons */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {QUICK_TIP_AMOUNTS.map((amount) => (
                            <Button
                                key={amount}
                                onClick={() => handleQuickTip(amount)}
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "flex-1 min-w-[60px] text-white",
                                    customAmount === amount.toString() && !selectedActivity
                                        ? "bg-purple-600 border-purple-600 hover:bg-purple-700"
                                        : "bg-gray-700 border-gray-600 hover:bg-purple-600 hover:border-purple-600"
                                )}
                            >
                                {amount}
                            </Button>
                        ))}
                    </div>

                    {/* Custom Amount */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 mb-1 block">
                                {selectedActivity ? 'Selected tip:' : 'Custom amount:'}
                            </label>
                            <Input
                                type="number"
                                min="1"
                                value={customAmount}
                                onChange={(e) => {
                                    setCustomAmount(e.target.value);
                                    setSelectedActivity(null); // Clear selection when typing custom amount
                                }}
                                className="h-9 bg-gray-700 border-gray-600 text-white text-sm"
                                placeholder="Enter amount"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={selectedActivity ? handleSendSelectedTip : handleCustomTip}
                                size="sm"
                                className="h-9 bg-green-600 hover:bg-green-700 text-white px-6 font-semibold"
                            >
                                <Gift className="w-4 h-4 mr-2" />
                                Send Tip
                            </Button>
                        </div>
                    </div>

                    {selectedActivity && (
                        <p className="text-xs text-purple-400 mt-2 text-center">
                            Click "Send Tip" to send <span className="font-semibold">{selectedActivity.tokens} tokens</span> for "{selectedActivity.name}"
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
