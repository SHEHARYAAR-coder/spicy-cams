"use client";

import { DashboardSidebar } from "./dashboard-sidebar";
import { UserRole } from "@prisma/client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  userName: string | null;
  userEmail: string;
  avatarUrl: string | null;
}

export function DashboardLayout({
  children,
  userRole,
  userName,
  userEmail,
  avatarUrl,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <DashboardSidebar
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <main className="container mx-auto p-6">{children}</main>
      </div>
    </div>
  );
}
