"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search, Star, Image as ImageIcon, PlaySquare,
} from "lucide-react";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AuthModal from "@/components/auth/auth-modal";
import { useStream } from "@/contexts/StreamContext";
import { useCategoryType, CategoryType } from "@/contexts/CategoryContext";

export function Header() {
  const { data: session, status } = useSession();
  const { isStreaming, streamData } = useStream();
  const { selectedCategoryType, setSelectedCategoryType, showCategoryBar } = useCategoryType();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewerLoginOpen, setViewerLoginOpen] = useState(false);
  const [modelLoginOpen, setModelLoginOpen] = useState(false);
  const [viewerSignupOpen, setViewerSignupOpen] = useState(false);
  const [modelSignupOpen, setModelSignupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [onlineModelsCount, setOnlineModelsCount] = useState<number>(0);

  // Fetch online models count
  useEffect(() => {
    const fetchOnlineCount = async () => {
      try {
        const response = await fetch('/api/streams/online-count');
        const data = await response.json();
        setOnlineModelsCount(data.count || 0);
      } catch (error) {
        console.error('Failed to fetch online models count:', error);
        setOnlineModelsCount(0);
      }
    };

    fetchOnlineCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchOnlineCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/" });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.push(`/?${params.toString()}`);
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
    "/v/login",
    "/v/register",
    "/m/login",
    "/m/register"
  ];
  const shouldHideHeader = hideHeaderPaths.some((path) =>
    pathname?.startsWith(path)
  );

  if (shouldHideHeader) {
    return null;
  }

  return (
    <>
      <header className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50  fixed w-full top-0 z-50">
        <div className="mx-auto px-4 py-3 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 group transition-all duration-300 hover:opacity-80">
                <img
                  src="/logo/logo.png"
                  alt="SpicyCams Logo"
                  className="h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              {(sessionUser?.role !== "MODEL") && (
                <div className={'flex items-center justify-center gap-2'}>
                  <Link
                    href={'/all-models/'}
                    className={'relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-gray-600'}
                  >
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>All Models</span>
                  </Link>
                  <Link
                    href={'/top-models/'}
                    className={'relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-gray-600 bg-gradient-to-r from-purple-600/20 to-pink-600/20'}
                  >
                    <Star className="w-4 h-4 text-pink-400 fill-pink-400" />
                    <span>Top Models</span>
                  </Link>
                </div>
              )}

              {onlineModelsCount > 0 && (
                <div className={'relative inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-gray-600'}>
                  <span className={'flex gap-1.5'}>
                    Live Streams
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-green-500 rounded-full">
                      {onlineModelsCount}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Center nav pill - Only show when logged in */}
            {session?.user && (
              <nav className="hidden md:flex flex-1 items-center justify-center">
                <div className="relative rounded-full border border-gray-700/50 bg-gray-800/60 backdrop-blur-lg px-2 py-1 shadow-xl">
                  <ul className="flex items-center gap-0.5">
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
                            className={`relative inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${active
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

            <div className="flex items-center space-x-2">
              {/* Search Bar for Streams - Always visible */}
              <div className={`relative ${session?.user ? 'block' : 'hidden'}`}>
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search streams..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && pathname !== '/') {
                      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
                    }
                  }}
                  className="pl-8 pr-3 py-1.5 text-xs bg-gray-800/60 border-gray-700/50 text-gray-200 placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 rounded-full transition-all duration-300 w-40 lg:w-52"
                />
              </div>

              {session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div tabIndex={0} className="outline-none">
                      <Avatar className="w-8 h-8 cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-purple-500 hover:shadow-lg hover:shadow-purple-500/50 ring-offset-1 ring-offset-gray-900">
                        <AvatarImage
                          src={sessionUser?.image || undefined}
                          alt="User avatar"
                          className="object-cover w-8 h-8 rounded-full"
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
                      .role === "MODEL" && (
                        <DropdownMenuItem asChild>
                          <Link href="/model" className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-purple-600/20 focus:bg-purple-600/20">
                            <Settings className="w-4 h-4 mr-3 text-purple-400" />
                            <span className="font-medium">Model Studio</span>
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
                <div className="flex items-center gap-2 flex-wrap">
                  {/* <Button
                  onClick={() => setViewerLoginOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-800/60 transition-all duration-300 font-medium border border-gray-700/50 hover:border-gray-600"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign In as Viewer</span>
                  <span className="sm:hidden">Viewer Sign In</span>
                </Button>

                <Button
                  onClick={() => setModelLoginOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-800/60 transition-all duration-300 font-medium border border-gray-700/50 hover:border-gray-600"
                >
                  <Video className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign In as Model</span>
                  <span className="sm:hidden">Model Sign In</span>
                </Button>

                
                <Button
                  onClick={() => setViewerSignupOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 font-medium"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Up as Viewer</span>
                  <span className="sm:hidden">Viewer Sign Up</span>
                </Button>

                <Button
                  onClick={() => setModelSignupOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white shadow-lg shadow-pink-500/30 transition-all duration-300 font-medium"
                >
                  <Video className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Up as Model</span>
                  <span className="sm:hidden">Model Sign Up</span>
                </Button> */}

                  <Button
                    onClick={() => setViewerSignupOpen(true)}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 font-medium"
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Create Free Account</span>
                    <span className="sm:hidden">Create Free Account</span>
                  </Button>

                  <Button
                    onClick={() => setViewerLoginOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-white hover:bg-gray-800/60 transition-all duration-300 font-medium border border-gray-700/50 hover:border-gray-600"
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Log In</span>
                    <span className="sm:hidden">Log In</span>
                  </Button>


                  {/* Auth Modals */}
                  <AuthModal
                    open={viewerLoginOpen}
                    onOpenChange={setViewerLoginOpen}
                    userType="viewer"
                    initialTab="login"
                  />
                  <AuthModal
                    open={viewerSignupOpen}
                    onOpenChange={setViewerSignupOpen}
                    userType="viewer"
                    initialTab="signup"
                  />
                  <AuthModal
                    open={modelLoginOpen}
                    onOpenChange={setModelLoginOpen}
                    userType="model"
                    initialTab="login"
                  />
                  <AuthModal
                    open={modelSignupOpen}
                    onOpenChange={setModelSignupOpen}
                    userType="model"
                    initialTab="signup"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation Bar - Hidden on specific routes */}
      {!pathname?.startsWith('/dashboard') &&
        !pathname?.startsWith('/profile') &&
        !pathname?.startsWith('/m/') &&
        !pathname?.startsWith('/inbox') &&
        !pathname?.startsWith('/support') && (
          <div 
            className={`bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 shadow-lg fixed w-full top-[4rem] z-40 transition-transform duration-300 ${
              showCategoryBar ? 'translate-y-0' : '-translate-y-full'
            }`}
          >
            <div className="mx-auto px-4 lg:px-6">
              {/* Show model info when streaming, otherwise show categories */}
              {isStreaming && streamData ? (
                <div className="flex items-center justify-start gap-4 py-2">
                  {/* Model Avatar and Name */}
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 ring-2 ring-purple-500/50">
                      <AvatarImage
                        src={streamData.model.image || undefined}
                        alt={streamData.model.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800">
                        <User className="w-5 h-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold">{streamData.model.name}</p>
                      <p className="text-xs text-gray-400">Streaming now</p>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="h-8 w-px bg-gray-700/50" />

                  {/* Model Profile Links */}
                  <Link
                    href={`/profile/${streamData.model.id}`}
                    className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-purple-500"
                  >
                    <User className="w-4 h-4 text-purple-400" />
                    <span>Profile</span>
                  </Link>

                  <Link
                    href={`/profile/${streamData.model.id}?tab=photos`}
                    className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-purple-500"
                  >
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>Photos</span>
                  </Link>

                  <Link
                    href={`/profile/${streamData.model.id}?tab=videos`}
                    className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-purple-500"
                  >
                    <PlaySquare className="w-4 h-4 text-purple-400" />
                    <span>Videos</span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-start gap-6 py-2 font-medium text-sm pt-[1rem]">
                  <button
                    onClick={() => {
                      setSelectedCategoryType("girls");
                      if (pathname?.startsWith('/tags/')) {
                        router.push('/tags/girls');
                      }
                    }}
                    className={`transition-all duration-300 font-medium ${selectedCategoryType === 'girls'
                      ? 'text-white border-b-2 border-purple-500 pb-1'
                      : 'text-gray-300 hover:text-white'
                      }`}
                  >
                    Girls
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategoryType("couples");
                      if (pathname?.startsWith('/tags/')) {
                        router.push('/tags/couples');
                      }
                    }}
                    className={`transition-all duration-300 font-medium ${selectedCategoryType === 'couples'
                      ? 'text-white border-b-2 border-purple-500 pb-1'
                      : 'text-gray-300 hover:text-white'
                      }`}
                  >
                    Couples
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategoryType("guys");
                      if (pathname?.startsWith('/tags/')) {
                        router.push('/tags/guys');
                      }
                    }}
                    className={`transition-all duration-300 font-medium ${selectedCategoryType === 'guys'
                      ? 'text-white border-b-2 border-purple-500 pb-1'
                      : 'text-gray-300 hover:text-white'
                      }`}
                  >
                    Guys
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategoryType("trans");
                      if (pathname?.startsWith('/tags/')) {
                        router.push('/tags/trans');
                      }
                    }}
                    className={`transition-all duration-300 font-medium ${selectedCategoryType === 'trans'
                      ? 'text-white border-b-2 border-purple-500 pb-1'
                      : 'text-gray-300 hover:text-white'
                      }`}
                  >
                    Trans
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
}

export const Navigation = Header;
