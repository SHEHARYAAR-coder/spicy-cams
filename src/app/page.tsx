"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { StreamCard } from "@/components/stream";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sidebar } from "@/components/sidebar";
import { PrivateChatContainer } from "@/components/chat";
import {
  Video,
  Play,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import AuthModal from "@/components/auth/auth-modal";

interface Stream {
  id: string;
  title: string;
  description: string;
  status: "LIVE" | "SCHEDULED" | "ENDED";
  category?: string;
  tags?: string[];
  thumbnailUrl?: string;
  createdAt: Date;
  model: {
    id: string;
    name: string;
    image?: string;
  };
  participantCount?: number;
}

// API response has 'avatar' instead of 'image'
interface StreamApiResponse {
  id: string;
  title: string;
  description: string;
  status: "LIVE" | "SCHEDULED" | "ENDED";
  category?: string;
  tags?: string[];
  thumbnailUrl?: string;
  createdAt: string;
  model: {
    id: string;
    name: string;
    avatar?: string;
  };
  participantCount?: number;
}

// Category Row Component with horizontal scrolling
interface CategoryRowProps {
  category: string;
  streams: Stream[];
  onJoinStream: (streamId: string) => void;
}

function CategoryRow({ category, streams, onJoinStream }: CategoryRowProps) {

  // Determine if we should use 2 rows or 1 row based on stream count
  const shouldUseTwoRows = streams.length > 6;
  const gridRowsClass = shouldUseTwoRows ? 'grid-rows-2' : 'grid-rows-1';

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -800 : 800;
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollability, 100);
    }
  };

  // Check scrollability on mount and resize
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollability();
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);

      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [streams]);

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 px-2 md:px-3">{category}</h2>

      <div className="relative group">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 text-white p-2 md:p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        {/* Streams Container - Dynamic Rows with Horizontal Scroll */}
        <div
          ref={scrollContainerRef}
          className={`grid ${gridRowsClass} grid-flow-col auto-cols-max gap-3 overflow-x-auto scrollbar-hide pb-4 px-2 md:px-3 scroll-smooth`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {streams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              onJoinStream={onJoinStream}
              className="w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px]"
            />
          ))}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 text-white p-2 md:p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [viewerSignupOpen, setViewerSignupOpen] = useState(false);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [selectedCategory, setSelectedCategory] = useState("Home");
  const [viewMode, _setViewMode] = useState<"grid" | "list">("grid");
  const urlCategory = searchParams.get('category');



  const fetchStreams = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/streams/list");
      if (response.ok) {
        const data = await response.json();
        const streamsWithDates = (data.streams || []).map((stream: StreamApiResponse) => ({
          ...stream,
          createdAt: new Date(stream.createdAt),
          model: {
            id: stream.model.id,
            name: stream.model.name,
            image: stream.model.avatar, // Map avatar to image for consistency
          },
        }));
        setStreams(streamsWithDates);
      }
    } catch (error) {
      console.error("Error fetching streams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
    // Refresh streams every 30 seconds
    const interval = setInterval(fetchStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync searchQuery with URL search params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
  }, [searchParams]);

  // Filter streams based on current filters
  useEffect(() => {
    let filtered = [...streams];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (stream) =>
          stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stream.model.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          stream.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // URL Category filter (from header links: girls, couples, guys, trans)
    if (urlCategory) {
      const categoryLower = urlCategory.toLowerCase();
      filtered = filtered.filter((stream) => {
        const streamCategory = stream.category?.toLowerCase() || '';
        // Match exact category or common variations
        return streamCategory.includes(categoryLower) ||
          (categoryLower === 'girls' && streamCategory.includes('girl')) ||
          (categoryLower === 'couples' && streamCategory.includes('couple')) ||
          (categoryLower === 'guys' && streamCategory.includes('guy')) ||
          (categoryLower === 'trans' && (streamCategory.includes('trans') || streamCategory.includes('transgender')));
      });
    }

    // Sidebar Category filter: only filter if not Home or All Girls Cams
    if (
      selectedCategory &&
      selectedCategory !== "Home" &&
      selectedCategory !== "All Girls Cams" &&
      !urlCategory // Don't apply sidebar filter if URL category is active
    ) {
      filtered = filtered.filter(
        (stream) => stream.category === selectedCategory
      );
    }

    setFilteredStreams(filtered);
  }, [
    streams,
    searchQuery,
    selectedCategory,
    urlCategory,
  ]);

  const handleJoinStream = (streamId: string) => {
    if (!session) {
      setViewerSignupOpen(true);
      // Redirect to login if not authenticated
      //window.location.href = `/v/login?callbackUrl=/streaming?join=${streamId}`;
    } else {
      // Go to streaming page
      window.location.href = `/streaming?join=${streamId}`;
    }
  };

  // Group streams by category
  const groupedStreams = filteredStreams.reduce((acc, stream) => {
    const category = stream.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(stream);
    return acc;
  }, {} as Record<string, Stream[]>);

  // Check if user is a model
  const sessionUser = session?.user as { role?: string } | undefined;
  const isModel = sessionUser?.role === "MODEL";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <AuthModal
        open={viewerSignupOpen}
        onOpenChange={setViewerSignupOpen}
        userType="viewer"
        initialTab="signup"
      />
      <div className="flex gap-5 min-h-screen">
        {/* Sidebar Component */}
        <Sidebar
          streams={streams}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Main Content - Full width on mobile, flush next to sidebar on desktop */}
        <div className="flex-1 flex flex-col lg:ml-56 pt-[6rem] h-screen overflow-hidden">{/* Top Filters Bar & Search Bar - hidden for Private Messages */}
          {selectedCategory !== "Private Messages" && (
            <>
              {/*<div className="bg-gray-900/70 backdrop-blur-sm border-b border-gray-700/50 p-3 md:p-4">*/}
              {/*  <div className="flex flex-wrap items-center gap-2 md:gap-4">*/}
              {/*    /!* Regions Filter *!/*/}
              {/*    <div className="flex items-center gap-2 text-sm md:text-base">*/}
              {/*      <MapPin className="w-4 h-4 text-purple-400" />*/}
              {/*      <select*/}
              {/*        value={selectedRegion}*/}
              {/*        onChange={(e) => setSelectedRegion(e.target.value)}*/}
              {/*        className="bg-gray-800/80 border border-gray-600/50 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-gray-800"*/}
              {/*      >*/}
              {/*        {regions.map((region) => (*/}
              {/*          <option key={region} value={region}>*/}
              {/*            {region}*/}
              {/*          </option>*/}
              {/*        ))}*/}
              {/*      </select>*/}
              {/*    </div>*/}

              {/*    /!* Age Filter *!/*/}
              {/*    <div className="flex items-center gap-2 text-sm md:text-base">*/}
              {/*      <Calendar className="w-4 h-4 text-purple-400" />*/}
              {/*      <select*/}
              {/*        value={selectedAge}*/}
              {/*        onChange={(e) => setSelectedAge(e.target.value)}*/}
              {/*        className="bg-gray-800/80 border border-gray-600/50 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-gray-800"*/}
              {/*      >*/}
              {/*        {ages.map((age) => (*/}
              {/*          <option key={age} value={age}>*/}
              {/*            {age}*/}
              {/*          </option>*/}
              {/*        ))}*/}
              {/*      </select>*/}
              {/*    </div>*/}

              {/*    /!* Ethnicity Filter *!/*/}
              {/*    <div className="flex items-center gap-2 text-sm md:text-base">*/}
              {/*      <Users className="w-4 h-4 text-purple-400" />*/}
              {/*      <select*/}
              {/*        value={selectedEthnicity}*/}
              {/*        onChange={(e) => setSelectedEthnicity(e.target.value)}*/}
              {/*        className="bg-purple-600 border border-purple-500 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400"*/}
              {/*      >*/}
              {/*        {ethnicities.map((ethnicity) => (*/}
              {/*          <option key={ethnicity} value={ethnicity}>*/}
              {/*            {ethnicity}*/}
              {/*          </option>*/}
              {/*        ))}*/}
              {/*      </select>*/}
              {/*    </div>*/}

              {/*    /!* Features Filter *!/*/}
              {/*    <Button*/}
              {/*      variant="outline"*/}
              {/*      size="sm"*/}
              {/*      className="border-gray-600 text-gray-900 hover:bg-gray-700 hover:text-purple-300 hidden md:flex"*/}
              {/*    >*/}
              {/*      <Star className="w-4 h-4" />*/}
              {/*      <span className="hidden lg:inline ml-1">Features</span>*/}
              {/*    </Button>*/}

              {/*    /!* Fetishes Filter *!/*/}
              {/*    <Button*/}
              {/*      variant="outline"*/}
              {/*      size="sm"*/}
              {/*      className="border-gray-600 text-gray-900 hover:bg-gray-700 hover:text-purple-300 hidden md:flex"*/}
              {/*    >*/}
              {/*      <Heart className="w-4 h-4" />*/}
              {/*      <span className="hidden lg:inline ml-1">Fetishes</span>*/}
              {/*    </Button>*/}

              {/*    /!* Language Filter *!/*/}
              {/*    <div className="hidden md:flex items-center gap-2 text-sm md:text-base">*/}
              {/*      <Languages className="w-4 h-4 text-purple-400" />*/}
              {/*      <select*/}
              {/*        value={selectedLanguage}*/}
              {/*        onChange={(e) => setSelectedLanguage(e.target.value)}*/}
              {/*        className="bg-gray-800/80 border border-gray-600/50 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-gray-800"*/}
              {/*      >*/}
              {/*        {languages.map((language) => (*/}
              {/*          <option key={language} value={language}>*/}
              {/*            {language}*/}
              {/*          </option>*/}
              {/*        ))}*/}
              {/*      </select>*/}
              {/*    </div>*/}

              {/*    /!* Search Bar *!/*/}
              {/*    <div className="ml-auto flex items-center gap-2">*/}
              {/*      <div className="relative flex items-center">*/}
              {/*        /!* Expandable Search Container *!/*/}
              {/*        <div*/}
              {/*          className={`relative flex items-center transition-all duration-500 ease-in-out rounded-full backdrop-blur-sm ${isSearchOpen*/}
              {/*            ? "w-64 md:w-96 bg-gray-800/95 border-2 border-purple-500 shadow-lg shadow-purple-500/30"*/}
              {/*            : "w-10 h-10 bg-gray-800/80 border border-gray-600 hover:border-gray-500"*/}
              {/*            }`}*/}
              {/*        >*/}
              {/*          /!* Search Input *!/*/}
              {/*          <Input*/}
              {/*            type="text"*/}
              {/*            placeholder="Search models, categories..."*/}
              {/*            value={searchQuery}*/}
              {/*            onChange={(e) => setSearchQuery(e.target.value)}*/}
              {/*            className={`h-10 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-gray-400 text-sm md:text-base transition-all duration-500 rounded-full ${isSearchOpen*/}
              {/*              ? "pl-5 pr-14 opacity-100 visible"*/}
              {/*              : "w-0 pl-0 pr-0 opacity-0 invisible"*/}
              {/*              }`}*/}
              {/*            autoFocus={isSearchOpen}*/}
              {/*          />*/}

              {/*          /!* Search Icon Button *!/*/}
              {/*          <Button*/}
              {/*            type="button"*/}
              {/*            size="icon"*/}
              {/*            onClick={() => setIsSearchOpen(!isSearchOpen)}*/}
              {/*            className={`absolute right-1 rounded-full transition-all duration-300 z-10 shadow-none ${isSearchOpen*/}
              {/*              ? "bg-transparent hover:bg-gray-700/50 border-0 h-8 w-8"*/}
              {/*              : "bg-transparent h-8 w-8 border-0"*/}
              {/*              }`}*/}
              {/*          >*/}
              {/*            <Search*/}
              {/*              className={`transition-all duration-300 ${isSearchOpen ? "w-4 h-4 text-purple-400 rotate-90" : "w-5 h-5 text-gray-400"*/}
              {/*                }`}*/}
              {/*            />*/}
              {/*          </Button>*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </div>*/}
              {/*  </div>*/}
              {/*</div>*/}
            </>
          )}

          {/* Promotional Banner - Only for viewers */}
          {selectedCategory !== "Private Messages" && !isModel && (
            <div className="px-2 py-5 md:px-3">
              <div className="relative bg-gradient-to-r from-green-800 via-green-700 to-green-800 rounded-lg px-3 py-1.5 overflow-hidden shadow-lg">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-6 h-6 opacity-15">
                  <span className="text-2xl">🎁</span>
                </div>
                <div className="absolute top-0 right-0 w-6 h-6 opacity-15">
                  <span className="text-2xl">🎅</span>
                </div>

                <div className="relative z-10 flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎁</span>
                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span className="bg-red-600 px-1.5 py-0.5 rounded text-xs">50% OFF</span>
                      <span className="hidden sm:inline">Tokens for XXXmas</span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="hidden md:inline text-white text-xs font-medium">
                      Warm up your nights with someone special!
                    </p>
                    <Link href={session ? "/pricing" : "#"}>
                      <Button
                        onClick={() => !session && setViewerSignupOpen(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-3 py-1 text-xs rounded shadow-lg whitespace-nowrap h-auto"
                      >
                        GET DISCOUNT
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show promotional card after 2nd category row */}
          {!session && (
            <div className="px-2">
              <Link href="/m/register" className="block group">
                <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-lg px-4 py-3 overflow-hidden border-2 border-pink-500/30 hover:border-pink-500 transition-all duration-300 shadow-lg hover:shadow-pink-500/20">
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/30 to-transparent animate-shimmer" />

                  <div className="relative z-10 flex flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div>

                        <h2 className="">
                          Get popular fast — stream in the region!
                        </h2>
                      </div>
                    </div>
                    <button className="relative bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-pink-500 text-white font-bold px-8 md:px-10 py-3 text-xs md:text-sm rounded-lg shadow-2xl shadow-fuchsia-500/50 hover:shadow-fuchsia-500/70 hover:scale-105 transition-all duration-300 uppercase tracking-wider overflow-hidden group">
                      {/* Glowing effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-white/20 to-fuchsia-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                      {/* Inner glow */}
                      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400"></div>

                      {/* Button text */}
                      <span className="relative z-10">Become A Model</span>

                      {/* Animated border glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-300 animate-pulse"></div>
                    </button>

                  </div>
                </div>
              </Link>
            </div>
          )}



          {/* Content Area */}
          <div className="flex-1 p-2 md:p-3 overflow-y-auto  scrollbar-hide ">
            {selectedCategory === "Private Messages" ? (
              <PrivateChatContainer streamId="homepage" token={null} />
            ) : loading && streams.length === 0 ? (
              <div
                className={`grid gap-3 md:gap-4 ${viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  : "grid-cols-1"
                  }`}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <Card
                    key={i}
                    className="animate-pulse bg-gray-800 border-gray-700"
                  >
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gray-700 rounded-t-lg" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : Object.keys(groupedStreams).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedStreams).map(([category, categoryStreams]) => (
                  <CategoryRow
                    key={category}
                    category={category}
                    streams={categoryStreams}
                    onJoinStream={handleJoinStream}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-gray-700 bg-gray-800 mt-12">
                <CardContent className="p-12 text-center">
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-12 h-12 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No Streams Found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery
                      ? "No streams match your search criteria."
                      : "No streams available right now."}
                  </p>
                  {session && (
                    <Link href="/streaming">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Video className="w-4 h-4 mr-2" />
                        Be the First to Go Live
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Floating "Go Live" Button - Only visible for models */}
      {session && isModel && selectedCategory !== "Private Messages" && (
        <Link href="/streaming?mode=create">
          <Button
            className="text-white fixed bottom-8 right-8 h-16 w-32 rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-700 hover:via-purple-600 hover:to-pink-600 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center group"
            title="Go Live"
          >
            <Video className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
            Go Live
          </Button>
        </Link>
      )}

      {/* Bottom Banner - Join SpicyCams */}
      {!session && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 border-t-2 border-purple-500 shadow-2xl">
          <div className="mx-auto px-4 py-3 lg:px-8">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-white animate-pulse" />
                <span className="text-white font-bold text-base md:text-lg">
                  Join SpicyCams to interact with models!
                </span>
              </div>
              <Button
                onClick={() => setViewerSignupOpen(true)}
                className="bg-white hover:bg-gray-100 text-purple-700 font-bold px-6 py-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
              >
                Join FREE
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
