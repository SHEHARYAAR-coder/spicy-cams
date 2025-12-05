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
  Menu,
  X,
} from "lucide-react";

import React, { useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserData {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  profile?: {
    avatarUrl?: string;
    displayName?: string;
  };
}

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const [userData, setUserData] = useState<UserData | null>(null);
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
    } catch (_err) {
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

  // Show skeleton only while auth is resolving or while profile is fetching for an authenticated user
  if (status === "loading" || (session?.user && loading)) {
    return (
      <header className="bg-gray-900/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-800/50">
        <div className="w-full">
          <div className="flex h-16 items-center">
            <div className="w-64 px-6">
              <div className="animate-pulse h-6 w-24 bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gray-900/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-800/50">
      <div className="w-full">
        <div className="flex items-center h-16">
          <div className="flex items-center flex-shrink-0 px-4 md:w-64 md:px-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                SpicyCams
              </span>
            </Link>
          </div>

          {/* Center nav pill - Desktop */}
          <nav className="hidden md:flex flex-1 items-center justify-center">
            <div className="relative rounded-full border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm px-2 py-1 shadow-md">
              <ul className="flex items-center">
                {[
                  { label: "Home", href: "/" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "About", href: "/about" },
                  { label: "Streaming", href: "/streaming" },
                ].map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));
                  return (
                    <li key={item.href} className="px-1">
                      <Link
                        href={item.href}
                        className={`relative inline-flex items-center rounded-full px-4 py-2 text-sm transition-colors ${active
                          ? "text-white"
                          : "text-gray-300 hover:text-white hover:bg-gray-700/60"
                          }`}
                      >
                        <span className="whitespace-nowrap">{item.label}</span>
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

          {/* Mobile menu button */}
          <div className="flex md:hidden flex-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white hover:bg-gray-800/60"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0 justify-end px-4 md:w-64 md:px-6">
            {(session?.user as { role?: string })?.role === "ADMIN" && (
              <Link href="/streams" className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-purple-400 hover:bg-gray-800/60"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
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

                  {((session.user as import("../../lib/auth-utils").SessionUser)
                    .role === "CREATOR" ||
                    (session.user as import("../../lib/auth-utils").SessionUser)
                      .role === "ADMIN") && (
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
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-300 hover:text-purple-400"
                      >
                        Sign In
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-800 border-gray-700 text-gray-300">
                      <DropdownMenuItem asChild>
                        <Link
                          href="/v/login"
                          className="cursor-pointer"
                        >
                          <User className="w-4 h-4 mr-2" />
                          <span>Sign In as Viewer</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/m/login"
                          className="cursor-pointer"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          <span>Sign In as Model</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm px-3 sm:px-4"
                    >
                      Sign Up
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700 text-gray-300">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/v/register"
                        className="cursor-pointer"
                      >
                        <User className="w-4 h-4 mr-2" />
                        <span>Sign Up as Viewer</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/m/register"
                        className="cursor-pointer"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        <span>Sign Up as Model</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800/50 bg-gray-900/95 backdrop-blur-md">
            <nav className="px-4 py-3 space-y-1">
              {[
                { label: "Home", href: "/" },
                { label: "Pricing", href: "/pricing" },
                { label: "About", href: "/about" },
                { label: "Streaming", href: "/streaming" },
              ].map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-sm transition-colors ${active
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// Backwards compatibility: keep Navigation export as an alias
export const Navigation = Header;
