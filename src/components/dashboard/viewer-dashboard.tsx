import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "./stats-card";
import { Wallet, Video, Clock, TrendingUp } from "lucide-react";
import { generateChartData } from "@/lib/chart-utils";

interface ViewerDashboardProps {
  userData: {
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    balance: number;
    totalWatchTimeMs: number;
    activeStreamSessions: number;
  };
}

export function ViewerDashboard({ userData }: ViewerDashboardProps) {
  const watchTimeHours = Math.floor(
    userData.totalWatchTimeMs / (1000 * 60 * 60)
  );
  const watchTimeMinutes = Math.floor(
    (userData.totalWatchTimeMs % (1000 * 60 * 60)) / (1000 * 60)
  );

  return (
    <div className="space-y-6">
      {/* User Profile Section */}
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">
            Welcome back, {userData.displayName || "Viewer"}!
          </CardTitle>
          <CardDescription className="text-gray-400">
            {userData.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {userData.avatarUrl && (
            <img
              src={userData.avatarUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/50"
            />
          )}
          <div>
            <p className="text-sm text-gray-300">Role: Viewer</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Credit Balance"
          value={`$${userData.balance.toFixed(2)}`}
          description="Available credits"
          icon={Wallet}
          chartData={generateChartData(userData.balance, 8, "increasing")}
          chartColor="green"
        />
        <StatsCard
          title="Watch Time"
          value={`${watchTimeHours}h ${watchTimeMinutes}m`}
          description="Total viewing time"
          icon={Clock}
          chartData={generateChartData(watchTimeHours, 8, "increasing")}
          chartColor="blue"
        />
        <StatsCard
          title="Active Sessions"
          value={userData.activeStreamSessions}
          description="Currently watching"
          icon={Video}
          chartData={generateChartData(
            userData.activeStreamSessions,
            8,
            "fluctuating"
          )}
          chartColor="purple"
        />
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <a
            href="/streaming"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Browse Streams
          </a>
          <a
            href="/pricing"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Buy Credits
          </a>
          <a
            href="/profile"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Edit Profile
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
