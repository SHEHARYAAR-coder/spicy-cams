import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Ban, VolumeX, Trash2 } from "lucide-react";

interface ModerationPanelProps {
    streamId: string;
}

export function ModerationPanel({ streamId }: ModerationPanelProps) {
    const [selectedDuration, setSelectedDuration] = useState(60);

    const handleClearChat = async () => {
        if (!confirm("Are you sure you want to clear all chat messages? This cannot be undone.")) {
            return;
        }

        try {
            // This would need a dedicated API endpoint
            console.log("Clear chat not yet implemented");
            alert("Clear chat feature coming soon!");
        } catch (error) {
            console.error("Error clearing chat:", error);
        }
    };

    return (
        <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Moderation Tools</h3>
            </div>

            <div className="space-y-4">
                {/* Ban/Mute Duration Selector */}
                <div>
                    <label className="text-sm font-medium mb-2 block">
                        Default Duration (minutes)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {[5, 15, 60, 1440].map((duration) => (
                            <Button
                                key={duration}
                                variant={selectedDuration === duration ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedDuration(duration)}
                            >
                                {duration < 60 ? `${duration}m` : duration === 60 ? "1h" : "24h"}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Quick Actions</label>
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={handleClearChat}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All Chat
                        </Button>
                    </div>
                </div>

                {/* Info */}
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <p className="font-medium mb-1">Moderation Tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Hover over messages to see moderation options</li>
                        <li>Mute temporarily restricts chat for a user</li>
                        <li>Ban permanently removes chat access</li>
                        <li>All actions are logged</li>
                    </ul>
                </div>

                {/* Recent Actions Log (placeholder) */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Recent Actions</label>
                    <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                        <p>No recent moderation actions</p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
