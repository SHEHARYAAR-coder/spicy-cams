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
  LogOut,
  User,
  Hand,
  LayoutDashboard,
} from "lucide-react";

import React from "react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/" });
  };

  // Get user data directly from session
  const sessionUser = session?.user as import("../../lib/auth-utils").SessionUser | undefined;

  // Hide header on auth pages and upgrade page
  const hideHeaderPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify",
    "/upgrade",
    "/v/",
    "/m/",
  ];
  const shouldHideHeader = hideHeaderPaths.some((path) =>
    pathname?.startsWith(path)
  );

  if (shouldHideHeader) {
    return null;
  }

  // Show skeleton only while auth is resolving
  if (status === "loading") {
    return (
      <header className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 shadow-lg sticky top-0 z-50">
        <div className="mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="animate-pulse h-8 w-32 bg-gray-700 rounded" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 shadow-lg sticky top-0 z-50">
      <div className="mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 group transition-all duration-300 hover:opacity-80">
              <img 
                src="/logo/logo.png" 
                alt="SpicyCams Logo" 
                className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            </Link>
          </div>

          {/* Center nav pill - Only show when logged in */}
          {session?.user && (
            <nav className="hidden md:flex flex-1 items-center justify-center">
              <div className="relative rounded-full border border-gray-700/50 bg-gray-800/60 backdrop-blur-lg px-3 py-1.5 shadow-xl">
                <ul className="flex items-center gap-1">
                  {[
                    { label: "Home", href: "/" },
                    { label: "Pricing", href: "/pricing" },
                    { label: "Streaming", href: "/streaming" },
                  ].map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== "/" && pathname?.startsWith(item.href));
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`relative inline-flex items-center rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${active
                            ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/50"
                            : "text-gray-300 hover:text-white hover:bg-gray-700/70"
                            }`}
                        >
                          <span className="whitespace-nowrap relative z-10">
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div tabIndex={0} className="outline-none">
                    <Avatar className="w-10 h-10 cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-purple-500 hover:shadow-lg hover:shadow-purple-500/50 ring-offset-2 ring-offset-gray-900">
                      <AvatarImage
                        src={sessionUser?.image || undefined}
                        alt="User avatar"
                        className="object-cover w-10 h-10 rounded-full"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800">
                        <User className="w-5 h-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800/95 backdrop-blur-lg border-gray-700/50 text-gray-200 shadow-2xl min-w-[220px]">
                  <DropdownMenuLabel
                    className="flex items-center justify-start px-3 py-2.5 font-medium text-white"
                  >
                    <Hand className="w-4 h-4 mr-2 text-purple-400" /> Hi,{" "}
                    {sessionUser?.name || "User"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700/50" />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-purple-600/20 focus:bg-purple-600/20">
                      <LayoutDashboard className="w-4 h-4 mr-3 text-purple-400" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-purple-600/20 focus:bg-purple-600/20">
                      <User className="w-4 h-4 mr-3 text-purple-400" />
                      <span className="font-medium">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/streaming" className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-purple-600/20 focus:bg-purple-600/20">
                      <Video className="w-4 h-4 mr-3 text-purple-400" />
                      <span className="font-medium">Streaming</span>
                    </Link>
                  </DropdownMenuItem>

                  {(session.user as import("../../lib/auth-utils").SessionUser)
                    .role === "CREATOR" && (
                      <DropdownMenuItem asChild>
                        <Link href="/creator" className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-purple-600/20 focus:bg-purple-600/20">
                          <Settings className="w-4 h-4 mr-3 text-purple-400" />
                          <span className="font-medium">Creator Studio</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  <DropdownMenuSeparator className="bg-gray-700/50" />
                  <DropdownMenuItem
                    onSelect={handleSignOut}
                    className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 px-3 py-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="font-medium">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-white hover:bg-gray-800/60 transition-all duration-300 font-medium"
                    >
                      Sign In
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800/95 backdrop-blur-lg border-gray-700/50 text-gray-200 shadow-2xl min-w-[200px]">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/v/login"
                        className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-purple-600/20 focus:bg-purple-600/20"
                      >
                        <User className="w-4 h-4 mr-3 text-purple-400" />
                        <span className="font-medium">Sign In as Viewer</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/m/login"
                        className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-purple-600/20 focus:bg-purple-600/20"
                      >
                        <Video className="w-4 h-4 mr-3 text-purple-400" />
                        <span className="font-medium">Sign In as Model</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 font-medium"
                    >
                      Sign Up
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800/95 backdrop-blur-lg border-gray-700/50 text-gray-200 shadow-2xl min-w-[200px]">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/v/register"
                        className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-purple-600/20 focus:bg-purple-600/20"
                      >
                        <User className="w-4 h-4 mr-3 text-purple-400" />
                        <span className="font-medium">Sign Up as Viewer</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/m/register"
                        className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-purple-600/20 focus:bg-purple-600/20"
                      >
                        <Video className="w-4 h-4 mr-3 text-purple-400" />
                        <span className="font-medium">Sign Up as Model</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export const Navigation = Header;
