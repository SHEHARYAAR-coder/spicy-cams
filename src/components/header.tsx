"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
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
  Search, Star, Image as ImageIcon, PlaySquare, ChevronLeft, ChevronRight, Wallet,
} from "lucide-react";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AuthModal from "@/components/auth/auth-modal";
import { useStream } from "@/contexts/StreamContext";
import { useCategoryType } from "@/contexts/CategoryContext";
import { CustomTokenPurchaseModal } from "@/components/notifications/custom-token-purchase-modal";

export function Header() {
  const { data: session } = useSession();
  const { isStreaming, streamData, streamList, navigateToStream, refreshStreamList } = useStream();
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);

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

  // Refresh stream list when starting to watch (if list is empty or outdated)
  useEffect(() => {
    if (isStreaming && streamList.length === 0) {
      console.log('🔄 Stream list empty, refreshing...');
      refreshStreamList();
    }
  }, [isStreaming, streamList.length, refreshStreamList]);

  // Navigate to next/previous stream
  const handleNavigateStream = async (direction: 'next' | 'prev') => {
    if (isNavigating) return; // Prevent double-clicks

    setIsNavigating(true);
    const nextStreamId = navigateToStream(direction);

    if (nextStreamId) {
      console.log(`🎯 Navigating to stream: ${nextStreamId}`);
      // Use window.location for a full page reload to ensure clean state
      window.location.href = `/streaming?join=${nextStreamId}`;
    } else {
      console.log('⚠️ No stream found for navigation');
      setIsNavigating(false);
    }
  };

  const handleSignOut = () => {
    void signOut({ callbackUrl: `${window.location.origin}/` });
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
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="flex items-center space-x-2 group transition-all duration-300 hover:opacity-80">
                <div className="relative h-14 sm:h-20 lg:h-24 w-14 sm:w-20 lg:w-24">
                  <Image
                    src="/logo/logo.png"
                    alt="SpicyCams Logo"
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </Link>

              {(sessionUser?.role !== "MODEL") && (
                <div className={'hidden sm:flex items-center justify-center gap-2'}>
                  <Link
                    href={'/all-models/'}
                    className={'relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-gray-600'}
                  >
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="hidden md:inline">All Models</span>
                  </Link>
                  <Link
                    href={'/top-models/'}
                    className={'relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-gray-600 bg-gradient-to-r from-purple-600/20 to-pink-600/20'}
                  >
                    <Star className="w-4 h-4 text-pink-400 fill-pink-400" />
                    <span className="hidden md:inline">Top Models</span>
                  </Link>
                </div>
              )}

              {onlineModelsCount > 0 && (
                <div className={'relative hidden sm:inline-flex items-center rounded-full px-2 sm:px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-gray-600'}>
                  <span className={'flex gap-1.5'}>
                    <span className="hidden md:inline">Live Streams</span>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-green-500 rounded-full">
                      {onlineModelsCount}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Center nav pill - Only show when NOT logged in */}
            {!session?.user && (
              <nav className="hidden md:flex flex-1 items-center justify-center">
                <div className="relative rounded-full border border-gray-700/50 bg-gray-800/60 backdrop-blur-lg px-2 py-1 shadow-xl">
                  <ul className="flex items-center gap-0.5">
                    {[
                      { label: "Home", href: "/" },
                      { label: "Pricing", href: "/pricing" },
                      // { label: "Streaming", href: "/streaming" },
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

            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Search Bar for Streams - Always visible */}
              <div className={`relative ${session?.user ? 'block' : 'hidden'}`}>
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && pathname !== '/') {
                      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
                    }
                  }}
                  className="pl-8 pr-3 py-1.5 text-xs bg-gray-800/60 border-gray-700/50 text-gray-200 placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 rounded-full transition-all duration-300 w-24 sm:w-32 md:w-40 lg:w-52"
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

                    {(session.user as import("../../lib/auth-utils").SessionUser)
                      .role === "VIEWER" && (
                        <DropdownMenuItem
                          onSelect={() => setShowTokenModal(true)}
                          className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-purple-600/20 focus:bg-purple-600/20"
                        >
                          <Wallet className="w-4 h-4 mr-3 text-purple-400" />
                          <span className="font-medium">Buy Tokens</span>
                        </DropdownMenuItem>
                      )}

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
            className={`bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 shadow-lg fixed w-full top-[4rem] z-40 transition-transform duration-300 ${showCategoryBar ? 'translate-y-0' : '-translate-y-full'
              }`}
          >
            <div className="mx-auto px-4 lg:px-6">
              {/* Show model info when streaming, otherwise show categories */}
              {isStreaming && streamData ? (
                <div className="flex items-center justify-start gap-2 sm:gap-4 py-2 overflow-x-auto scrollbar-hide">
                  {/* Previous Button */}
                  <button
                    onClick={() => handleNavigateStream('prev')}
                    className={`flex-shrink-0 p-1.5 sm:p-2 rounded-full transition-all duration-300 group ${streamList.length <= 1 || isNavigating
                      ? 'bg-gray-800/30 border border-gray-700/30 cursor-not-allowed opacity-50'
                      : 'bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 hover:border-purple-500 cursor-pointer'
                      }`}
                    title={streamList.length <= 1 ? 'No other streams' : 'Previous Stream'}
                    disabled={streamList.length <= 1 || isNavigating}
                  >
                    <ChevronLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${streamList.length <= 1 || isNavigating ? 'text-gray-500' : 'text-gray-300 group-hover:text-purple-400'
                      }`} />
                  </button>

                  {/* Model Avatar and Name */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-purple-500/50">
                      <AvatarImage
                        src={streamData.model.image || undefined}
                        alt={streamData.model.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm sm:text-base truncate max-w-[100px] sm:max-w-[150px]">{streamData.model.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400">
                        {streamList.length > 0 ? `${streamList.length} live` : 'Streaming now'}
                      </p>
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handleNavigateStream('next')}
                    className={`flex-shrink-0 p-1.5 sm:p-2 rounded-full transition-all duration-300 group ${streamList.length <= 1 || isNavigating
                      ? 'bg-gray-800/30 border border-gray-700/30 cursor-not-allowed opacity-50'
                      : 'bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 hover:border-purple-500 cursor-pointer'
                      }`}
                    title={streamList.length <= 1 ? 'No other streams' : 'Next Stream'}
                    disabled={streamList.length <= 1 || isNavigating}
                  >
                    <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${streamList.length <= 1 || isNavigating ? 'text-gray-500' : 'text-gray-300 group-hover:text-purple-400'
                      }`} />
                  </button>

                  {/* Separator */}
                  <div className="h-6 sm:h-8 w-px bg-gray-700/50 flex-shrink-0" />

                  {/* Model Profile Links */}
                  <Link
                    href={`/profile/${streamData.model.id}`}
                    className="relative inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-purple-500 flex-shrink-0"
                    title="Profile"
                  >
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="hidden sm:inline">Profile</span>
                  </Link>

                  <Link
                    href={`/profile/${streamData.model.id}?tab=photos`}
                    className="relative inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-purple-500 flex-shrink-0"
                    title="Photos"
                  >
                    <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="hidden sm:inline">Photos</span>
                  </Link>

                  <Link
                    href={`/profile/${streamData.model.id}?tab=videos`}
                    className="relative inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300 hover:bg-gray-800/60 hover:text-white text-gray-300 border border-gray-700/50 hover:border-purple-500 flex-shrink-0"
                    title="Videos"
                  >
                    <PlaySquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="hidden sm:inline">Videos</span>
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

      {/* Custom Token Purchase Modal */}
      <CustomTokenPurchaseModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
      />
    </>
  );
}

export const Navigation = Header;
