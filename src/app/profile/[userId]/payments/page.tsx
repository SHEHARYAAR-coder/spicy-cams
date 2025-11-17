"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  CreditCard,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  provider: string;
  providerRef: string;
  status: string;
  amount: number;
  currency: string;
  credits: number;
  completedAt: string | null;
  createdAt: string;
  failureReason: string | null;
}

interface Wallet {
  balance: number;
  currency: string;
}

export default function PaymentsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params using React.use()
  const { userId } = use(params);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user && userId !== session.user.id) {
      router.push("/unauthorized");
      return;
    }

    if (status === "authenticated") {
      fetchPayments();
    }
  }, [session, status, userId, router]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payments");

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();
      setPayments(data.payments);
      setWallet(data.wallet);
    } catch (err: any) {
      console.error("Error fetching payments:", err);
      setError(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Refunded
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          {/* <Button
            onClick={() => router.push("/pricing")}
            variant="ghost"
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pricing
          </Button> */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
                Payment History
              </h1>
              <p className="text-gray-400">
                View all your transactions and token purchases
              </p>
            </div>

            {/* Wallet Balance Card */}
            {wallet && (
              <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 backdrop-blur-sm border border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Current Balance</p>
                      <p className="text-2xl font-bold text-white">
                        {Number(wallet.balance).toLocaleString()} Tokens
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Payments Table */}
        <Card className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-purple-400" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg mb-2">No payments yet</p>
                <p className="text-gray-500 mb-6">
                  Purchase a token package to get started
                </p>
                <Button
                  onClick={() => router.push("/pricing")}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3"
                >
                  View Pricing Plans
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      <th className="text-left py-4 px-4 font-semibold text-purple-300">
                        Date
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-purple-300">
                        Transaction ID
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-purple-300">
                        Provider
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-purple-300">
                        Amount
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-purple-300">
                        Tokens
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-purple-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                      >
                        <td className="py-4 px-4 text-gray-400">
                          {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                          <br />
                          <span className="text-xs text-gray-500">
                            {format(new Date(payment.createdAt), "hh:mm a")}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <code className="text-xs bg-gray-700/50 px-2 py-1 rounded">
                            {payment.providerRef.substring(0, 20)}...
                          </code>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className="bg-gray-700/50 text-gray-300 border-gray-600/50">
                            {payment.provider}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 font-medium text-white">
                          ${Number(payment.amount).toFixed(2)}{" "}
                          {payment.currency}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-purple-400 font-medium">
                            {Number(payment.credits).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(payment.status)}
                          {payment.failureReason && (
                            <p className="text-xs text-red-400 mt-1">
                              {payment.failureReason}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        {payments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <CardContent className="p-6">
                <p className="text-sm text-gray-400 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-white">
                  $
                  {payments
                    .filter((p) => p.status === "SUCCEEDED")
                    .reduce((sum, p) => sum + Number(p.amount), 0)
                    .toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <CardContent className="p-6">
                <p className="text-sm text-gray-400 mb-1">
                  Total Tokens Purchased
                </p>
                <p className="text-2xl font-bold text-purple-400">
                  {payments
                    .filter((p) => p.status === "SUCCEEDED")
                    .reduce((sum, p) => sum + Number(p.credits), 0)
                    .toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <CardContent className="p-6">
                <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                <p className="text-2xl font-bold text-white">
                  {payments.length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
