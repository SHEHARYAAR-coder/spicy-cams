import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatGatePromptProps {
    balance: number;
    reason?: string;
}

export function ChatGatePrompt({ balance, reason }: ChatGatePromptProps) {
    const router = useRouter();

    return (
        <Card className="p-6 m-4">
            <div className="flex flex-col items-center text-center space-y-4">
                {/* Lock Icon */}
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-gray-400" />
                </div>

                {/* Heading */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Chat Requires Credits
                    </h3>
                    <p className="text-sm text-gray-600">
                        {reason || "You need credits in your wallet to participate in chat."}
                    </p>
                </div>

                {/* Balance Display */}
                <div className="bg-gray-50 rounded-lg p-4 w-full">
                    <div className="text-sm text-gray-600 mb-1">Current Balance</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {balance.toFixed(2)} <span className="text-sm font-normal">credits</span>
                    </div>
                </div>

                {/* Minimum Requirement */}
                <div className="text-xs text-gray-500">
                    Minimum balance required: <strong>1 credit</strong>
                </div>

                {/* Top Up Button */}
                <Button
                    onClick={() => router.push("/dashboard/wallet")}
                    className="w-full"
                    size="lg"
                >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Top Up Credits
                </Button>

                {/* Info */}
                <p className="text-xs text-gray-500">
                    Credits are used to access chat and watch streams. They never expire!
                </p>
            </div>
        </Card>
    );
}
