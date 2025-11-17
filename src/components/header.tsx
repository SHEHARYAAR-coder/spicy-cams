"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Video,
  Settings,
  Shield,
  LogOut,
  User,
  Hand,
  LayoutDashboard,
} from "lucide-react";

import React, { useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Memoize the fetch function to prevent recreation on every render
  const fetchProfile = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUserData(data);
    } catch (err) {
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const userId = useMemo(() => session?.user?.id, [session?.user?.id]);

  React.useEffect(() => {
    if (userId && !userData) {
      fetchProfile(userId);
    }
  }, [userId, userData, fetchProfile]);

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/" });
  };

  // Hide header on auth pages and upgrade page
  const hideHeaderPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify",
    "/upgrade",
  ];
  const shouldHideHeader = hideHeaderPaths.some((path) =>
    pathname?.startsWith(path)
  );

  if (shouldHideHeader) {
    return null;
  }

  // Show skeleton only while auth is resolving or while profile is fetching for an authenticated user
  if (status === "loading" || (session?.user && loading)) {
    return (
      <header className="bg-gray-900 shadow-sm sticky top-0 z-50">
        <div className="mx-auto px-5">
          <div className="flex justify-between h-16 items-center">
            <div className="animate-pulse h-6 w-24 bg-gray-700 rounded" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gray-900 shadow-sm sticky top-0 z-50">
      <div className="mx-auto px-5">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
                SpicyCams
              </span>
            </Link>
          </div>

          {/* Center nav pill - Only show when logged in */}
          {session?.user && (
            <nav className="hidden md:flex flex-1 items-center justify-center">
              <div className="relative rounded-full border border-gray-700 bg-gray-800/70 backdrop-blur px-2 py-1 shadow-sm">
                <ul className="flex items-center">
                  {[
                    { label: "Home", href: "/" },
                    { label: "Pricing", href: "/pricing" },
                    { label: "Streaming", href: "/streaming" },
                  ].map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== "/" && pathname?.startsWith(item.href));
                    return (
                      <li key={item.href} className="px-1">
                        <Link
                          href={item.href}
                          className={`relative inline-flex items-center rounded-full px-4 py-2 text-sm transition-colors ${
                            active
                              ? "text-white"
                              : "text-gray-300 hover:text-white hover:bg-gray-700/60"
                          }`}
                        >
                          <span className="whitespace-nowrap">
                            {item.label}
                          </span>
                          {active && (
                            <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-purple-400" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>
          )}

          <div className="flex items-center space-x-3">
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div tabIndex={0} className="outline-none">
                    <Avatar className="w-8 h-8 cursor-pointer transition-all hover:ring-2 hover:ring-purple-400 hover:shadow-[0_0_16px_4px_rgba(168,85,247,0.5)]">
                      <AvatarImage
                        src={userData?.profile?.avatarUrl || undefined}
                        alt="User avatar"
                        className="object-cover w-8 h-8 rounded-full"
                      />
                      <AvatarFallback>
                        <User className="w-4 h-4 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-gray-300">
                  <DropdownMenuLabel
                    className={"flex items-center justify-start"}
                  >
                    <Hand className={"w-4 h-4 mr-2"} /> hi,{" "}
                    {
                      (
                        session.user as import("../../lib/auth-utils").SessionUser
                      ).name
                    }
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/streaming" className="cursor-pointer">
                      <Video className="w-4 h-4 mr-2" />
                      <span>Streaming</span>
                    </Link>
                  </DropdownMenuItem>

                  {(session.user as import("../../lib/auth-utils").SessionUser)
                    .role === "CREATOR" && (
                    <DropdownMenuItem asChild>
                      <Link href="/creator" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        <span>Creator Studio</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    onSelect={handleSignOut}
                    className="cursor-pointer text-red-400"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-purple-400"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export const Navigation = Header;
