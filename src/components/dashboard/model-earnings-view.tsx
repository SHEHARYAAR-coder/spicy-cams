"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DollarSign,
    TrendingUp,
    Video,
    Calendar,
    Loader2,
    Download,
    ArrowUpRight,
    Coins,
} from "lucide-react";

interface EarningsData {
    totalEarnings: number;
    currentBalance: number;
    last7DaysEarnings: number;
    last30DaysEarnings: number;
    earningsBreakdown: Array<{
        streamId: string;
        streamTitle: string;
        totalEarnings: number;
        transactionCount: number;
        streamStatus: string;
        streamDate: Date;
    }>;
    recentTransactions: Array<{
        id: string;
        amount: number;
        description: string;
        createdAt: Date;
        metadata: Record<string, unknown>;
    }>;
}

export function ModelEarningsView() {
    const { data: session, status } = useSession();
    const _router = useRouter();
    const [earnings, setEarnings] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const response = await fetch("/api/earnings");
                if (response.ok) {
                    const data = await response.json();
                    setEarnings(data);
                } else {
                    console.error("Failed to fetch earnings");
                }
            } catch (error) {
                console.error("Error fetching earnings:", error);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchEarnings();
        }
    }, [session]);

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (!session || !earnings) {
        return null;
    }

    const calculateGrowth = (recent: number, total: number) => {
        if (total === 0) return 0;
        return ((recent / total) * 100).toFixed(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Earnings Dashboard
                    </h1>
                    <p className="text-gray-400">
                        Track your streaming revenue and performance
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">
                            Total Earnings
                        </CardTitle>
                        <DollarSign className="w-4 h-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            ${earnings.totalEarnings.toFixed(2)}
                        </div>
                        <p className="text-xs text-green-400 mt-1">All-time revenue</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">
                            Current Balance
                        </CardTitle>
                        <Coins className="w-4 h-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            ${earnings.currentBalance.toFixed(2)}
                        </div>
                        <p className="text-xs text-blue-400 mt-1">Available to withdraw</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">
                            Last 7 Days
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            ${earnings.last7DaysEarnings.toFixed(2)}
                        </div>
                        <p className="text-xs text-purple-400 mt-1 flex items-center">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            {calculateGrowth(earnings.last7DaysEarnings, earnings.totalEarnings)}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">
                            Last 30 Days
                        </CardTitle>
                        <Calendar className="w-4 h-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            ${earnings.last30DaysEarnings.toFixed(2)}
                        </div>
                        <p className="text-xs text-yellow-400 mt-1 flex items-center">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            {calculateGrowth(earnings.last30DaysEarnings, earnings.totalEarnings)}% of total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Earnings by Stream */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-400" />
                        Earnings by Stream
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {earnings.earningsBreakdown.length > 0 ? (
                            earnings.earningsBreakdown
                                .sort((a, b) => b.totalEarnings - a.totalEarnings)
                                .slice(0, 10)
                                .map((stream) => (
                                    <div
                                        key={stream.streamId}
                                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <h4 className="text-white font-medium">
                                                {stream.streamTitle}
                                            </h4>
                                            <p className="text-xs text-gray-400">
                                                {stream.transactionCount} viewers •{" "}
                                                {new Date(stream.streamDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-green-400 font-bold">
                                                ${stream.totalEarnings.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {stream.streamStatus}
                                            </div>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No earnings yet. Start streaming to earn!</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        Recent Transactions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {earnings.recentTransactions.length > 0 ? (
                            earnings.recentTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-700/50"
                                >
                                    <div className="flex-1">
                                        <p className="text-white text-sm">
                                            {transaction.description}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(transaction.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-green-400 font-bold">
                                        +${transaction.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p>No transactions yet</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
