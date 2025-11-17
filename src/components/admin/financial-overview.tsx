"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Download,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialData {
  stats: {
    totalRevenue: number;
    totalCreditsIssued: number;
    totalCreditsInCirculation: number;
    pendingRevenue: number;
    failedPayments: number;
    refundedAmount: number;
    revenueByProvider: {
      stripe: number;
      coinbase: number;
    };
  };
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  topSpenders: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    avatarUrl: string | null;
    totalSpent: number;
  }>;
  recentPayments: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string | null;
    provider: string;
    status: string;
    amount: number;
    credits: number;
    currency: string;
    priceId: string | null;
    priceName: string | null;
    failureReason: string | null;
    completedAt: string | null;
    createdAt: string;
  }>;
  recentLedgerEntries: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string | null;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    referenceType: string | null;
    referenceId: string | null;
    createdAt: string;
  }>;
}

interface FinancialOverviewProps {
  data: FinancialData;
}

export function FinancialOverview({ data }: FinancialOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState("overview");

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
        );
      case "FAILED":
        return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>;
      case "REFUNDED":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">Refunded</Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get ledger type badge
  const getLedgerTypeBadge = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />
            Deposit
          </Badge>
        );
      case "DEBIT":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 flex items-center gap-1">
            <ArrowDownRight className="h-3 w-3" />
            Debit
          </Badge>
        );
      case "REFUND":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Refund</Badge>;
      case "ADJUSTMENT":
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600">
            Adjustment
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Filter payments
  const filteredPayments = useMemo(() => {
    return data.recentPayments.filter((payment) => {
      const matchesSearch =
        payment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data.recentPayments, searchQuery, statusFilter]);

  // Calculate revenue growth
  const currentMonthRevenue =
    data.monthlyRevenue[data.monthlyRevenue.length - 1]?.revenue || 0;
  const previousMonthRevenue =
    data.monthlyRevenue[data.monthlyRevenue.length - 2]?.revenue || 0;
  const revenueGrowth =
    previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
        100
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(data.stats.totalRevenue)}
            </div>
            {revenueGrowth !== 0 && (
              <p
                className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                  revenueGrowth > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {revenueGrowth > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(revenueGrowth).toFixed(1)}% from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Credits in Circulation
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {data.stats.totalCreditsInCirculation.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {data.stats.totalCreditsIssued.toLocaleString()} total issued
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Pending Revenue
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(data.stats.pendingRevenue)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-red-500/50 transition-all hover:shadow-lg hover:shadow-red-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Failed Payments
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {data.stats.failedPayments}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formatCurrency(data.stats.refundedAmount)} refunded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Provider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Revenue by Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-300">Stripe</span>
                </div>
                <span className="text-white font-semibold">
                  {formatCurrency(data.stats.revenueByProvider.stripe)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                  <span className="text-gray-300">Coinbase</span>
                </div>
                <span className="text-white font-semibold">
                  {formatCurrency(data.stats.revenueByProvider.coinbase)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Spenders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topSpenders.slice(0, 3).map((spender, index) => (
                <div key={spender.userId} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm font-medium w-4">
                    #{index + 1}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={spender.avatarUrl || undefined} />
                    <AvatarFallback>
                      {spender.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {spender.userName}
                    </p>
                  </div>
                  <span className="text-sm text-green-400 font-semibold">
                    {formatCurrency(spender.totalSpent)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Monthly Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {data.monthlyRevenue.map((month, index) => {
              const maxRevenue = Math.max(
                ...data.monthlyRevenue.map((m) => m.revenue)
              );
              const height =
                maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-gray-400 mb-1">
                      {formatCurrency(month.revenue)}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t hover:from-purple-400 hover:to-purple-300 transition-all cursor-pointer"
                      style={{ height: `${height}%`, minHeight: "4px" }}
                      title={`${month.month}: ${formatCurrency(month.revenue)}`}
                    />
                  </div>
                  <span className="text-xs text-gray-400 rotate-45 origin-left mt-2">
                    {month.month}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Toggle for Payments and Ledger */}
      <div className="space-y-4">
        <div className="flex gap-2 bg-gray-800/50 border border-gray-700 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("overview")}
            className={
              activeTab === "overview"
                ? "bg-purple-600 hover:bg-purple-700"
                : ""
            }
          >
            Recent Payments
          </Button>
          <Button
            variant={activeTab === "ledger" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("ledger")}
            className={
              activeTab === "ledger" ? "bg-purple-600 hover:bg-purple-700" : ""
            }
          >
            Ledger Entries
          </Button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by user, email, or payment ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="SUCCEEDED">Succeeded</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payments Table */}
            <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800/70 border-gray-700 hover:bg-gray-800/70">
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Provider</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Credits</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-400 py-8"
                      >
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow
                        key={payment.id}
                        className="border-gray-700 hover:bg-gray-800/30"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={payment.userAvatar || undefined}
                              />
                              <AvatarFallback>
                                {payment.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">
                                {payment.userName}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {payment.userEmail}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-gray-300">
                            {payment.provider}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-white font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {payment.credits.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">
                          {formatDate(payment.completedAt || payment.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="space-y-4">
            {/* Ledger Table */}
            <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800/70 border-gray-700 hover:bg-gray-800/70">
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Type</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">
                      Balance After
                    </TableHead>
                    <TableHead className="text-gray-300">Description</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentLedgerEntries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-400 py-8"
                      >
                        No ledger entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.recentLedgerEntries.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="border-gray-700 hover:bg-gray-800/30"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={entry.userAvatar || undefined}
                              />
                              <AvatarFallback>
                                {entry.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">
                                {entry.userName}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {entry.userEmail}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getLedgerTypeBadge(entry.type)}</TableCell>
                        <TableCell
                          className={`font-medium ${
                            entry.type === "DEPOSIT" || entry.type === "REFUND"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {entry.type === "DEPOSIT" || entry.type === "REFUND"
                            ? "+"
                            : "-"}
                          {Math.abs(entry.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {entry.balanceAfter.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm max-w-xs truncate">
                          {entry.description || "N/A"}
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">
                          {formatDate(entry.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
