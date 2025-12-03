"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Withdrawal {
    id: string;
    amount: string;
    currency: string;
    status: string;
    createdAt: string;
    reviewedAt?: string;
    reviewNote?: string;
    user: {
        id: string;
        email: string;
        profile?: {
            displayName?: string;
        };
    };
    reviewer?: {
        email: string;
        profile?: {
            displayName?: string;
        };
    };
}

export function WithdrawalManagement() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);
    const [reviewNote, setReviewNote] = useState("");
    const [processing, setProcessing] = useState(false);

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
            } else {
                toast.error("Failed to fetch withdrawal requests");
            }
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
            toast.error("Error loading withdrawal requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (withdrawal: Withdrawal, action: "approve" | "reject") => {
        setSelectedWithdrawal(withdrawal);
        setDialogAction(action);
        setReviewNote("");
        setShowDialog(true);
    };

    const processAction = async () => {
        if (!selectedWithdrawal || !dialogAction) return;

        setProcessing(true);
        try {
            const response = await fetch(`/api/withdrawals/${selectedWithdrawal.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: dialogAction,
                    note: reviewNote,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || `Withdrawal ${dialogAction}d successfully`);
                setShowDialog(false);
                fetchWithdrawals(); // Refresh list
            } else {
                toast.error(data.error || "Failed to process withdrawal");
            }
        } catch (error) {
            console.error("Error processing withdrawal:", error);
            toast.error("Error processing withdrawal request");
        } finally {
            setProcessing(false);
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
    const processedWithdrawals = withdrawals.filter((w) => w.status !== "PENDING");

    const totalPendingAmount = pendingWithdrawals.reduce(
        (sum, w) => sum + parseFloat(w.amount),
        0
    );

    if (loading) {
        return (
            <Card className="bg-gray-900 border-gray-800">
                <CardContent className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">
                            Pending Requests
                        </CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {pendingWithdrawals.length}
                        </div>
                        <p className="text-xs text-gray-400">
                            ${totalPendingAmount.toFixed(2)} total
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">
                            Total Requests
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {withdrawals.length}
                        </div>
                        <p className="text-xs text-gray-400">All time</p>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">
                            Processed Today
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {
                                processedWithdrawals.filter(
                                    (w) =>
                                        w.reviewedAt &&
                                        new Date(w.reviewedAt).toDateString() === new Date().toDateString()
                                ).length
                            }
                        </div>
                        <p className="text-xs text-gray-400">Last 24 hours</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                    <CardTitle className="text-white">Withdrawal Requests</CardTitle>
                    <CardDescription className="text-gray-400">
                        Review and approve creator withdrawal requests
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {withdrawals.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No withdrawal requests yet</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Pending Requests */}
                            {pendingWithdrawals.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-yellow-500" />
                                        Pending Requests
                                    </h3>
                                    <div className="rounded-md border border-gray-800 overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-800/50 border-gray-700">
                                                    <TableHead className="text-gray-300">Creator</TableHead>
                                                    <TableHead className="text-gray-300">Amount</TableHead>
                                                    <TableHead className="text-gray-300">Requested</TableHead>
                                                    <TableHead className="text-gray-300">Status</TableHead>
                                                    <TableHead className="text-gray-300 text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingWithdrawals.map((withdrawal) => (
                                                    <TableRow key={withdrawal.id} className="border-gray-800">
                                                        <TableCell className="text-white">
                                                            <div>
                                                                <div className="font-medium">
                                                                    {withdrawal.user.profile?.displayName || "Unknown"}
                                                                </div>
                                                                <div className="text-sm text-gray-400">
                                                                    {withdrawal.user.email}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-white font-semibold">
                                                            ${parseFloat(withdrawal.amount).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-gray-300">
                                                            {formatDate(withdrawal.createdAt)}
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                                                                    onClick={() => handleAction(withdrawal, "approve")}
                                                                >
                                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                                                                    onClick={() => handleAction(withdrawal, "reject")}
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-1" />
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {/* Processed Requests */}
                            {processedWithdrawals.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-blue-500" />
                                        Recent History
                                    </h3>
                                    <div className="rounded-md border border-gray-800 overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-800/50 border-gray-700">
                                                    <TableHead className="text-gray-300">Creator</TableHead>
                                                    <TableHead className="text-gray-300">Amount</TableHead>
                                                    <TableHead className="text-gray-300">Requested</TableHead>
                                                    <TableHead className="text-gray-300">Reviewed</TableHead>
                                                    <TableHead className="text-gray-300">Status</TableHead>
                                                    <TableHead className="text-gray-300">Reviewer</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {processedWithdrawals.slice(0, 10).map((withdrawal) => (
                                                    <TableRow key={withdrawal.id} className="border-gray-800">
                                                        <TableCell className="text-white">
                                                            <div>
                                                                <div className="font-medium">
                                                                    {withdrawal.user.profile?.displayName || "Unknown"}
                                                                </div>
                                                                <div className="text-sm text-gray-400">
                                                                    {withdrawal.user.email}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-white font-semibold">
                                                            ${parseFloat(withdrawal.amount).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-gray-300">
                                                            {formatDate(withdrawal.createdAt)}
                                                        </TableCell>
                                                        <TableCell className="text-gray-300">
                                                            {withdrawal.reviewedAt
                                                                ? formatDate(withdrawal.reviewedAt)
                                                                : "-"}
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                                                        <TableCell className="text-gray-300">
                                                            {withdrawal.reviewer?.profile?.displayName ||
                                                                withdrawal.reviewer?.email ||
                                                                "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="bg-gray-900 border-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogAction === "approve" ? "Approve" : "Reject"} Withdrawal Request
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {selectedWithdrawal && (
                                <>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span>Creator:</span>
                                            <span className="font-medium text-white">
                                                {selectedWithdrawal.user.profile?.displayName ||
                                                    selectedWithdrawal.user.email}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Amount:</span>
                                            <span className="font-medium text-white">
                                                ${parseFloat(selectedWithdrawal.amount).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Requested:</span>
                                            <span className="font-medium text-white">
                                                {formatDate(selectedWithdrawal.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">
                                Review Note {dialogAction === "reject" && "(Required)"}
                            </label>
                            <Textarea
                                placeholder={
                                    dialogAction === "approve"
                                        ? "Optional note for approval..."
                                        : "Please provide a reason for rejection..."
                                }
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDialog(false)}
                            disabled={processing}
                            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={processAction}
                            disabled={processing || (dialogAction === "reject" && !reviewNote)}
                            className={
                                dialogAction === "approve"
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-red-500 hover:bg-red-600 text-white"
                            }
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {dialogAction === "approve" ? (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                    ) : (
                                        <XCircle className="w-4 h-4 mr-2" />
                                    )}
                                    {dialogAction === "approve" ? "Approve & Process" : "Reject"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
