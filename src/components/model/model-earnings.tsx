"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DollarSign,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Withdrawal {
    id: string;
    amount: string;
    currency: string;
    status: string;
    createdAt: string;
    reviewedAt?: string;
    reviewNote?: string;
}

interface ModelEarningsProps {
    balance: number;
    totalEarnings: number;
}

export function ModelEarnings({ balance, totalEarnings }: ModelEarningsProps) {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [processing, setProcessing] = useState(false);

    const MIN_WITHDRAWAL = 50;

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/withdrawals");
            if (response.ok) {
                const data = await response.json();
                setWithdrawals(data.withdrawals);
            }
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawRequest = async () => {
        const amount = parseFloat(withdrawAmount);

        if (!amount || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (amount < MIN_WITHDRAWAL) {
            toast.error(`Minimum withdrawal amount is $${MIN_WITHDRAWAL}`);
            return;
        }

        if (amount > balance) {
            toast.error("Insufficient balance");
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch("/api/withdrawals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || "Withdrawal request submitted successfully");
                setShowWithdrawDialog(false);
                setWithdrawAmount("");
                fetchWithdrawals();
            } else {
                toast.error(data.error || "Failed to submit withdrawal request");
            }
        } catch (error) {
            console.error("Error creating withdrawal:", error);
            toast.error("Error submitting withdrawal request");
        } finally {
            setProcessing(false);
        }
    };

    const cancelWithdrawal = async (withdrawalId: string) => {
        try {
            const response = await fetch(`/api/withdrawals/${withdrawalId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || "Withdrawal cancelled");
                fetchWithdrawals();
            } else {
                toast.error(data.error || "Failed to cancel withdrawal");
            }
        } catch (error) {
            console.error("Error cancelling withdrawal:", error);
            toast.error("Error cancelling withdrawal");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                );
            case "APPROVED":
                return (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                    </Badge>
                );
            case "REJECTED":
                return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                    </Badge>
                );
            case "COMPLETED":
                return (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                    </Badge>
                );
            case "FAILED":
                return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Failed
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const pendingWithdrawals = withdrawals.filter((w) => w.status === "PENDING");
    const hasPendingWithdrawal = pendingWithdrawals.length > 0;

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">
                            Available Balance
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">
                            ${balance.toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Ready to withdraw
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">
                            Total Earnings
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">
                            ${totalEarnings.toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            All time earnings
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">
                            Pending Withdrawals
                        </CardTitle>
                        <Clock className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">
                            {pendingWithdrawals.length}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            ${pendingWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0).toFixed(2)} total
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-white">Earnings & Withdrawals</CardTitle>
                            <CardDescription className="text-gray-400">
                                Manage your earnings and request withdrawals
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setShowWithdrawDialog(true)}
                            disabled={balance < MIN_WITHDRAWAL || hasPendingWithdrawal}
                            className="bg-green-500 hover:bg-green-600 text-white"
                        >
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Request Withdrawal
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {balance < MIN_WITHDRAWAL && (
                        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-yellow-500">
                                        Minimum Withdrawal Not Met
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        You need at least ${MIN_WITHDRAWAL.toFixed(2)} in your balance to request a withdrawal.
                                        Current balance: ${balance.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {hasPendingWithdrawal && (
                        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-500">
                                        Pending Withdrawal Request
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        You have a pending withdrawal request. Please wait for admin approval before submitting another request.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : withdrawals.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No withdrawal requests yet</p>
                            <p className="text-sm mt-2">
                                Request a withdrawal once you have at least ${MIN_WITHDRAWAL} in your balance
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border border-gray-800 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-800/50 border-gray-700">
                                        <TableHead className="text-gray-300">Amount</TableHead>
                                        <TableHead className="text-gray-300">Status</TableHead>
                                        <TableHead className="text-gray-300">Requested</TableHead>
                                        <TableHead className="text-gray-300">Reviewed</TableHead>
                                        <TableHead className="text-gray-300">Note</TableHead>
                                        <TableHead className="text-gray-300 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawals.map((withdrawal) => (
                                        <TableRow key={withdrawal.id} className="border-gray-800">
                                            <TableCell className="text-white font-semibold">
                                                ${parseFloat(withdrawal.amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                                            <TableCell className="text-gray-300">
                                                {formatDate(withdrawal.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-gray-300">
                                                {withdrawal.reviewedAt ? formatDate(withdrawal.reviewedAt) : "-"}
                                            </TableCell>
                                            <TableCell className="text-gray-400 text-sm max-w-xs truncate">
                                                {withdrawal.reviewNote || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {withdrawal.status === "PENDING" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                                                        onClick={() => cancelWithdrawal(withdrawal.id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Withdrawal Dialog */}
            <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                <DialogContent className="bg-gray-900 border-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Request Withdrawal</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Enter the amount you would like to withdraw from your balance
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">
                                Withdrawal Amount
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="number"
                                    placeholder={`Min: ${MIN_WITHDRAWAL}`}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    min={MIN_WITHDRAWAL}
                                    max={balance}
                                    step="0.01"
                                    className="bg-gray-800 border-gray-700 text-white pl-10"
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Available: ${balance.toFixed(2)}</span>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-blue-400"
                                    onClick={() => setWithdrawAmount(balance.toString())}
                                >
                                    Withdraw All
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-800 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Processing Time:</span>
                                <span className="text-white">1-3 business days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Minimum Amount:</span>
                                <span className="text-white">${MIN_WITHDRAWAL.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Payment Method:</span>
                                <span className="text-white">Stripe Transfer</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowWithdrawDialog(false)}
                            disabled={processing}
                            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleWithdrawRequest}
                            disabled={processing || !withdrawAmount || parseFloat(withdrawAmount) < MIN_WITHDRAWAL}
                            className="bg-green-500 hover:bg-green-600 text-white"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <ArrowUpRight className="w-4 h-4 mr-2" />
                                    Submit Request
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
