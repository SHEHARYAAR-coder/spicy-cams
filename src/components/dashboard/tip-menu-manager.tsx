"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, X, Loader2 } from "lucide-react";

interface TipMenuItem {
    id: string;
    icon: string;
    name: string;
    tokens: number;
    category: string;
    isActive: boolean;
    sortOrder: number;
}

const COMMON_EMOJIS = [
    "💋", "😊", "🎵", "💄", "🦶", "🍒", "💗", "👅", "💇", "😈",
    "📱", "📸", "🌹", "❤️", "💝", "🔥", "⭐", "💎", "🎁", "🎉",
    "💃", "🍑", "👠", "💅", "👗", "💋", "🥂", "🍾", "🎭", "🎪"
];

export function TipMenuManager() {
    const [items, setItems] = useState<TipMenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [_editingId, _setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        icon: "💋",
        name: "",
        tokens: 10,
        category: "tip",
    });

    useEffect(() => {
        fetchTipMenu();
    }, []);

    const fetchTipMenu = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/tip-menu/my-items");
            if (response.ok) {
                const data = await response.json();
                setItems(data.items || []);
            }
        } catch (error) {
            console.error("Error fetching tip menu:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!formData.name || formData.tokens < 1) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const response = await fetch("/api/tip-menu", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                await fetchTipMenu();
                setIsAdding(false);
                setFormData({ icon: "💋", name: "", tokens: 10, category: "tip" });
            } else {
                const data = await response.json();
                alert(data.error || "Failed to add item");
            }
        } catch (error) {
            console.error("Error adding item:", error);
            alert("Failed to add item");
        }
    };

    const _handleUpdate = async (itemId: string, updates: Partial<TipMenuItem>) => {
        try {
            const response = await fetch(`/api/tip-menu/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (response.ok) {
                await fetchTipMenu();
                _setEditingId(null);
            } else {
                alert("Failed to update item");
            }
        } catch (error) {
            console.error("Error updating item:", error);
            alert("Failed to update item");
        }
    };

    const handleDelete = async (itemId: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            const response = await fetch(`/api/tip-menu/${itemId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                await fetchTipMenu();
            } else {
                alert("Failed to delete item");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Failed to delete item");
        }
    };

    const getCategoryItems = (category: string) => {
        return items.filter((item) => item.category === category);
    };

    if (loading) {
        return (
            <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-white text-xl">Tip Menu Manager</CardTitle>
                        <p className="text-sm text-gray-400 mt-1">
                            Manage your custom tip menu items that viewers will see
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {isAdding ? (
                            <>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Add New Item Form */}
                {isAdding && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-4">
                        <h3 className="text-white font-semibold">Add New Tip Item</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-gray-300">Icon/Emoji</Label>
                                <Select
                                    value={formData.icon}
                                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                                >
                                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                        {COMMON_EMOJIS.map((emoji) => (
                                            <SelectItem key={emoji} value={emoji} className="text-white">
                                                <span className="text-2xl">{emoji}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-gray-300">Activity Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Blow kiss"
                                    className="bg-gray-700 border-gray-600 text-white"
                                />
                            </div>

                            <div>
                                <Label className="text-gray-300">Tokens</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.tokens}
                                    onChange={(e) => setFormData({ ...formData, tokens: parseInt(e.target.value) || 1 })}
                                    className="bg-gray-700 border-gray-600 text-white"
                                />
                            </div>

                            <div>
                                <Label className="text-gray-300">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                        <SelectItem value="tip" className="text-white">Tip Menu</SelectItem>
                                        <SelectItem value="toy" className="text-white">Sex Toy</SelectItem>
                                        <SelectItem value="games" className="text-white">Games & Fun</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAdding(false);
                                    setFormData({ icon: "💋", name: "", tokens: 10, category: "tip" });
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAdd}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Add Item
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tip Menu Items */}
                <div className="space-y-4">
                    {["tip", "toy", "games"].map((category) => {
                        const categoryItems = getCategoryItems(category);
                        if (categoryItems.length === 0) return null;

                        return (
                            <div key={category}>
                                <h3 className="text-white font-semibold mb-3 capitalize">
                                    {category === "tip" ? "Tip Menu" : category === "toy" ? "Sex Toy Controls" : "Games & Fun"}
                                </h3>

                                <div className="space-y-2">
                                    {categoryItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-purple-500/50 transition-all"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <span className="text-2xl">{item.icon}</span>
                                                <span className="text-gray-300">{item.name}</span>
                                                <span className="text-sm font-semibold text-purple-400 ml-auto">
                                                    {item.tokens} tokens
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {items.length === 0 && !isAdding && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 mb-4">No tip menu items yet</p>
                        <Button
                            onClick={() => setIsAdding(true)}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Item
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
