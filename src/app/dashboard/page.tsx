import { auth } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ViewerDashboard } from "@/components/dashboard/viewer-dashboard";
import { CreatorDashboard } from "@/components/dashboard/model-dashboard";
import { ModeratorDashboard } from "@/components/dashboard/moderator-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { UserRole, UserStatus, User, Profile, Wallet, Stream, StreamSession, ChatMessage, Follow, LedgerEntry, ModerationAction } from "@prisma/client";

// Define types for the user with related data
type UserWithRelations = User & {
  profile: Profile | null;
  wallet: Wallet | null;
  streams: (Stream & {
    sessions: StreamSession[];
    chatMessages: ChatMessage[];
  })[];
  streamSessions: StreamSession[];
  follows: Follow[];
  followers: Follow[];
  ledgerEntries: LedgerEntry[];
  moderationActions: ModerationAction[];
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as { id: string }).id;

  // Fetch user with related data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      wallet: true,
      streams: {
        include: {
          sessions: true,
          chatMessages: true,
        },
      },
      streamSessions: true,
      follows: true,
      followers: true,
      ledgerEntries: true,
      moderationActions: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Render different dashboards based on user role
  switch (user.role) {
    case UserRole.VIEWER:
      return <ViewerDashboardContent user={user} />;

    case UserRole.MODEL:
      return <CreatorDashboardContent user={user} />;

    case UserRole.MODERATOR:
      return <ModeratorDashboardContent user={user} />;

    case UserRole.ADMIN:
      return <AdminDashboardContent user={user} />;

    default:
      return <ViewerDashboardContent user={user} />;
  }
}

// Viewer Dashboard Component
async function ViewerDashboardContent({ user }: { user: UserWithRelations }) {
  const totalWatchTimeMs = user.streamSessions.reduce(
    (total: number, session) => total + session.totalWatchMs,
    0
  );

  const activeStreamSessions = user.streamSessions.filter(
    (session) => session.status === "active"
  ).length;

  const userData = {
    email: user.email,
    displayName: user.profile?.displayName || null,
    avatarUrl: user.profile?.avatarUrl || null,
    balance: Number(user.wallet?.balance || 0),
    totalWatchTimeMs,
    activeStreamSessions,
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-white">Dashboard</h1>
      <ViewerDashboard userData={userData} />
    </>
  );
}

// Model Dashboard Component
async function CreatorDashboardContent({ user }: { user: UserWithRelations }) {
  const totalStreams = user.streams.length;
  const liveStreams = user.streams.filter(
    (stream) => stream.status === "LIVE"
  ).length;

  // Calculate total views from all stream sessions
  const totalViews = user.streams.reduce((total: number, stream) => {
    return total + stream.sessions.length;
  }, 0);

  // Calculate average viewers per stream
  const avgViewersPerStream = totalStreams > 0 ? totalViews / totalStreams : 0;

  // Calculate total chat messages
  const totalChatMessages = user.streams.reduce(
    (total: number, stream) => {
      return total + stream.chatMessages.length;
    },
    0
  );

  // Calculate total earnings from ledger entries (DEPOSIT types)
  const totalEarnings = user.ledgerEntries
    .filter((entry) => entry.type === "DEPOSIT")
    .reduce((total: number, entry) => total + Number(entry.amount), 0);

  const userData = {
    email: user.email,
    displayName: user.profile?.displayName || null,
    avatarUrl: user.profile?.avatarUrl || null,
    balance: Number(user.wallet?.balance || 0),
    totalStreams,
    liveStreams,
    totalViews,
    totalEarnings,
    totalChatMessages,
    avgViewersPerStream,
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-white">Model Dashboard</h1>
      <CreatorDashboard userData={userData} />
    </>
  );
}

// Moderator Dashboard Component
async function ModeratorDashboardContent({ user }: { user: UserWithRelations }) {
  const totalModerationActions = user.moderationActions.length;

  // Get moderation actions from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActions = user.moderationActions.filter(
    (action) => new Date(action.createdAt) >= thirtyDaysAgo
  );

  const recentBans = recentActions.filter(
    (action) => action.action === "BAN"
  ).length;

  const recentMutes = recentActions.filter(
    (action) => action.action === "MUTE"
  ).length;

  const recentMessageDeletions = recentActions.filter(
    (action) => action.action === "DELETE_MESSAGE"
  ).length;

  // Get platform-wide stats
  const liveStreams = await prisma.stream.count({
    where: { status: "LIVE" },
  });

  const totalUsers = await prisma.user.count();

  const userData = {
    email: user.email,
    displayName: user.profile?.displayName || null,
    avatarUrl: user.profile?.avatarUrl || null,
    totalModerationActions,
    recentBans,
    recentMutes,
    recentMessageDeletions,
    activeReports: 0, // Placeholder - implement if you have a reports system
    liveStreams,
    totalUsers,
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-white">
        Moderator Dashboard
      </h1>
      <ModeratorDashboard userData={userData} />
    </>
  );
}

// Admin Dashboard Component
async function AdminDashboardContent({ user }: { user: UserWithRelations }) {
  // Get comprehensive platform statistics
  const totalUsers = await prisma.user.count();

  const activeUsers = await prisma.user.count({
    where: { status: UserStatus.ACTIVE },
  });

  const totalCreators = await prisma.profile.count({
    where: { isModel: true },
  });

  const totalStreams = await prisma.stream.count();

  const liveStreams = await prisma.stream.count({
    where: { status: "LIVE" },
  });

  // Calculate total revenue from all successful payments
  const payments = await prisma.payment.findMany({
    where: { status: "SUCCEEDED" },
  });
  const totalRevenue = payments.reduce(
    (total, payment) => total + Number(payment.amount),
    0
  );

  // Calculate total credits in circulation (sum of all wallet balances)
  const wallets = await prisma.wallet.findMany();
  const totalCreditsInCirculation = wallets.reduce(
    (total, wallet) => total + Number(wallet.balance),
    0
  );

  const totalModerationActions = await prisma.moderationAction.count();

  const pendingVerifications = await prisma.user.count({
    where: { status: UserStatus.PENDING_VERIFICATION },
  });

  const suspendedUsers = await prisma.user.count({
    where: { status: UserStatus.SUSPENDED },
  });

  const bannedUsers = await prisma.user.count({
    where: { status: UserStatus.BANNED },
  });

  const userData = {
    email: user.email,
    displayName: user.profile?.displayName || null,
    avatarUrl: user.profile?.avatarUrl || null,
  };

  const platformStats = {
    totalUsers,
    activeUsers,
    totalCreators,
    totalStreams,
    liveStreams,
    totalRevenue,
    totalCreditsInCirculation,
    totalModerationActions,
    pendingVerifications,
    suspendedUsers,
    bannedUsers,
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-white">Admin Dashboard</h1>
      <AdminDashboard userData={userData} platformStats={platformStats} />
    </>
  );
}
