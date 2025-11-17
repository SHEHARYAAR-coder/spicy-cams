import { prisma } from "@/lib/prisma";
import { FinancialOverview } from "@/components/admin/financial-overview";

export const metadata = {
  title: "Financial Overview - Admin",
  description: "View financial statistics and revenue analytics",
};

export default async function FinancesPage() {
  // Fetch comprehensive financial data
  // Admin check is handled in layout.tsx

  // Get all payments
  const payments = await prisma.payment.findMany({
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      price: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get all wallets
  const wallets = await prisma.wallet.findMany({
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  // Get ledger entries for detailed tracking
  const ledgerEntries = await prisma.ledgerEntry.findMany({
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100, // Latest 100 entries
  });

  // Calculate financial statistics
  const totalRevenue = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalCreditsIssued = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + Number(p.credits), 0);

  const totalCreditsInCirculation = wallets.reduce(
    (sum, w) => sum + Number(w.balance),
    0
  );

  const pendingRevenue = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const failedPayments = payments.filter((p) => p.status === "FAILED").length;

  const refundedAmount = payments
    .filter((p) => p.status === "REFUNDED")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Calculate revenue by provider
  const revenueByProvider = {
    stripe: payments
      .filter((p) => p.provider === "STRIPE" && p.status === "SUCCEEDED")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    coinbase: payments
      .filter((p) => p.provider === "COINBASE" && p.status === "SUCCEEDED")
      .reduce((sum, p) => sum + Number(p.amount), 0),
  };

  // Get top spenders
  const userSpending = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((acc: Record<string, { amount: number; user: any }>, payment) => {
      const userId = payment.userId;
      if (!acc[userId]) {
        acc[userId] = { amount: 0, user: payment.user };
      }
      acc[userId].amount += Number(payment.amount);
      return acc;
    }, {});

  const topSpenders = Object.entries(userSpending)
    .map(([userId, data]) => ({
      userId,
      userName: data.user.profile?.displayName || data.user.email,
      userEmail: data.user.email,
      avatarUrl: data.user.profile?.avatarUrl || null,
      totalSpent: data.amount,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Calculate monthly revenue (last 12 months)
  const now = new Date();
  const monthlyRevenue = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const revenue = payments
      .filter(
        (p) =>
          p.status === "SUCCEEDED" &&
          p.completedAt &&
          new Date(p.completedAt) >= monthStart &&
          new Date(p.completedAt) <= monthEnd
      )
      .reduce((sum, p) => sum + Number(p.amount), 0);

    monthlyRevenue.push({
      month: monthStart.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      revenue,
    });
  }

  // Transform payment data for table
  const recentPayments = payments.slice(0, 50).map((payment) => ({
    id: payment.id,
    userId: payment.userId,
    userName: payment.user.profile?.displayName || payment.user.email,
    userEmail: payment.user.email,
    userAvatar: payment.user.profile?.avatarUrl || null,
    provider: payment.provider,
    status: payment.status,
    amount: Number(payment.amount),
    credits: Number(payment.credits),
    currency: payment.currency,
    priceId: payment.priceId,
    priceName: payment.price?.name || null,
    failureReason: payment.failureReason,
    completedAt: payment.completedAt?.toISOString() || null,
    createdAt: payment.createdAt.toISOString(),
  }));

  // Transform ledger data
  const recentLedgerEntries = ledgerEntries.map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    userName: entry.user.profile?.displayName || entry.user.email,
    userEmail: entry.user.email,
    userAvatar: entry.user.profile?.avatarUrl || null,
    type: entry.type,
    amount: Number(entry.amount),
    balanceAfter: Number(entry.balanceAfter),
    description: entry.description,
    referenceType: entry.referenceType,
    referenceId: entry.referenceId,
    createdAt: entry.createdAt.toISOString(),
  }));

  const financialData = {
    stats: {
      totalRevenue,
      totalCreditsIssued,
      totalCreditsInCirculation,
      pendingRevenue,
      failedPayments,
      refundedAmount,
      revenueByProvider,
    },
    monthlyRevenue,
    topSpenders,
    recentPayments,
    recentLedgerEntries,
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-white">Financial Overview</h1>
      <FinancialOverview data={financialData} />
    </>
  );
}
