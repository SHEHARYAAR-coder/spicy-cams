"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StreamCard } from "@/components/stream";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PrivateChatContainer } from "@/components/chat";
import {
  Video,
  Users,
  Play,
  Star,
  MapPin,
  Calendar,
  Heart,
  Languages,
  Search,
  MessageCircle,
} from "lucide-react";

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

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Girls Cams");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedAge, setSelectedAge] = useState("");
  const [selectedEthnicity, setSelectedEthnicity] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [viewMode, _setViewMode] = useState<"grid" | "list">("grid");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === "All Models") {
      router.push("/m");
      return;
    }
    setSelectedCategory(categoryName);
  };

  const categories = [
    { name: "All Girls Cams", icon: Heart, count: 0, active: true },
    { name: "Private Messages", icon: MessageCircle, count: 0 },
    { name: "All Models", icon: Star, count: 0 },
    // { name: "GOLD Shows", icon: Star, count: 0 },
  ];

  // Get user role from session
  const sessionUser = session?.user as { isModel?: boolean; role?: string; roles?: string[] } | undefined;
  const isModel = !!(
    sessionUser &&
    (sessionUser.isModel ||
      sessionUser.role === "MODEL" ||
      (Array.isArray(sessionUser.roles) &&
        sessionUser.roles.includes("MODEL")))
  );

  // Filter categories based on user role
  const visibleCategories = categories.filter(category => {
    // Hide "All Models" for models
    if (category.name === "All Models" && isModel) {
      return false;
    }
    return true;
  });

  const categoryFilters = [
    { name: "Asian", hot: false },
    { name: "BDSM", hot: true },
    { name: "Big Cock", hot: false },
    { name: "Big Tits", hot: false },
    { name: "Black", hot: false },
    { name: "Huge Tits", hot: false },
    { name: "Latino", hot: false },
    { name: "Mature", hot: false },
    { name: "Medium Tits", hot: false },
    { name: "Mobile", hot: false },
    { name: "Small Tits", hot: false },
    { name: "Teen 18+", hot: false },
    { name: "Transgirl", hot: false },
    { name: "Transguy", hot: false },
    { name: "Uncut", hot: false },
  ];

  // Calculate category counts from streams
  const categoryCounts = categoryFilters.map((filter) => {
    const count = streams.filter(
      (stream) => stream.category === filter.name
    ).length;
    return { ...filter, count };
  });

  const regions = [
    "All Regions",
    "North America",
    "Europe",
    "Asia",
    "South America",
    "Africa",
    "Oceania",
  ];
  const ages = ["All Ages", "18-22", "23-30", "31-40", "40+"];
  const ethnicities = [
    "All Ethnicities",
    "White",
    "Asian",
    "Latina",
    "Black",
    "Mixed",
    "Other",
  ];
  const languages = [
    "All Languages",
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
  ];

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

    // Category filter
    if (selectedCategory && selectedCategory !== "All Girls Cams") {
      filtered = filtered.filter(
        (stream) => stream.category === selectedCategory
      );
    }

    setFilteredStreams(filtered);
  }, [
    streams,
    searchQuery,
    selectedCategory,
    selectedRegion,
    selectedAge,
    selectedEthnicity,
    selectedLanguage,
  ]);

  const handleJoinStream = (streamId: string) => {
    if (!session) {
      // Redirect to login if not authenticated
      window.location.href = `/login?callbackUrl=/streaming?join=${streamId}`;
    } else {
      // Go to streaming page
      window.location.href = `/streaming?join=${streamId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="flex min-h-screen">
        {/* Sidebar (offset below sticky header) - Hidden on mobile */}
        <div className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gradient-to-b from-gray-900 via-gray-900/98 to-gray-950 backdrop-blur-md border-r border-gray-800/80 overflow-y-auto scrollbar-hide z-40 shadow-2xl">
          <div className="p-5 space-y-6">
            {/* Main Categories Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 mb-3">
                Main Menu
              </h3>
              {visibleCategories.map((category) => {
                const IconComponent = category.icon;
                const isActive = selectedCategory === category.name;

                return (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryClick(category.name)}
                    className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${isActive
                      ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30 scale-[1.02]"
                      : "text-gray-300 hover:bg-gray-800/60 hover:text-white hover:translate-x-1"
                      }`}
                  >
                    {/* Background Glow Effect */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent blur-xl" />
                    )}

                    <IconComponent
                      className={`w-5 h-5 relative z-10 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"
                        }`}
                    />
                    <span className={`font-semibold text-sm relative z-10 flex-1 text-left`}>
                      {category.name}
                    </span>

                    {/* Status Indicators */}
                    {category.name === "All Girls Cams" && (
                      <div className="relative z-10 flex items-center gap-1">
                        <span className="text-xs font-medium text-purple-200">LIVE</span>
                        <div className="w-2 h-2 bg-purple-300 rounded-full shadow-lg shadow-purple-400/50" />
                      </div>
                    )}
                    {category.name === "Private Messages" && (
                      <div className="relative z-10 flex items-center gap-1">
                        <span className="text-xs font-medium text-green-200">NEW</span>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-900 px-3 text-xs text-gray-600">Categories</span>
              </div>
            </div>

            {/* Category Pages Section */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 mb-3">
                Browse by Category
              </h3>
              <div className="space-y-1">
                {categoryCounts.map((filter) => {
                  const isActive = selectedCategory === filter.name;

                  return (
                    <button
                      key={filter.name}
                      onClick={() => setSelectedCategory(filter.name)}
                      className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive
                        ? "bg-purple-600/90 text-white shadow-md shadow-purple-500/20"
                        : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        {/* Category Dot Indicator */}
                        <div
                          className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? "bg-white shadow-sm" : "bg-gray-600 group-hover:bg-gray-400"
                            }`}
                        />
                        <span className={`font-medium ${isActive ? "font-semibold" : ""}`}>
                          {filter.name}
                        </span>
                        {filter.hot && (
                          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] px-1.5 py-0 border-0 shadow-sm">
                            HOT
                          </Badge>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium tabular-nums ${isActive ? "text-purple-100" : "text-gray-500 group-hover:text-gray-400"
                            }`}
                        >
                          {filter.count}
                        </span>
                        {isActive && (
                          <div className="w-1 h-1 bg-purple-200 rounded-full animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Spacer */}
            <div className="h-4" />
          </div>
        </div>

        {/* Main Content - Full width on mobile, offset on desktop */}
        <div className="flex-1 flex flex-col lg:ml-72">
          {/* Top Filters Bar & Search Bar - hidden for Private Messages */}
          {selectedCategory !== "Private Messages" && (
            <>
              <div className="bg-gray-900/70 backdrop-blur-sm border-b border-gray-700/50 p-3 md:p-4">
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  {/* Regions Filter */}
                  <div className="flex items-center gap-2 text-sm md:text-base">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="bg-gray-800/80 border border-gray-600/50 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-gray-800"
                    >
                      {regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Age Filter */}
                  <div className="flex items-center gap-2 text-sm md:text-base">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <select
                      value={selectedAge}
                      onChange={(e) => setSelectedAge(e.target.value)}
                      className="bg-gray-800/80 border border-gray-600/50 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-gray-800"
                    >
                      {ages.map((age) => (
                        <option key={age} value={age}>
                          {age}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ethnicity Filter */}
                  <div className="flex items-center gap-2 text-sm md:text-base">
                    <Users className="w-4 h-4 text-purple-400" />
                    <select
                      value={selectedEthnicity}
                      onChange={(e) => setSelectedEthnicity(e.target.value)}
                      className="bg-purple-600 border border-purple-500 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      {ethnicities.map((ethnicity) => (
                        <option key={ethnicity} value={ethnicity}>
                          {ethnicity}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Features Filter */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-900 hover:bg-gray-700 hover:text-purple-300 hidden md:flex"
                  >
                    <Star className="w-4 h-4" />
                    <span className="hidden lg:inline ml-1">Features</span>
                  </Button>

                  {/* Fetishes Filter */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-900 hover:bg-gray-700 hover:text-purple-300 hidden md:flex"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="hidden lg:inline ml-1">Fetishes</span>
                  </Button>

                  {/* Language Filter */}
                  <div className="hidden md:flex items-center gap-2 text-sm md:text-base">
                    <Languages className="w-4 h-4 text-purple-400" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-gray-800/80 border border-gray-600/50 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-gray-800"
                    >
                      {languages.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Bar */}
                  <div className="ml-auto flex items-center gap-2">
                    <div className="relative flex items-center">
                      {/* Expandable Search Container */}
                      <div
                        className={`relative flex items-center transition-all duration-500 ease-in-out rounded-full backdrop-blur-sm ${isSearchOpen
                          ? "w-64 md:w-96 bg-gray-800/95 border-2 border-purple-500 shadow-lg shadow-purple-500/30"
                          : "w-10 h-10 bg-gray-800/80 border border-gray-600 hover:border-gray-500"
                          }`}
                      >
                        {/* Search Input */}
                        <Input
                          type="text"
                          placeholder="Search models, categories..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`h-10 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-gray-400 text-sm md:text-base transition-all duration-500 rounded-full ${isSearchOpen
                            ? "pl-5 pr-14 opacity-100 visible"
                            : "w-0 pl-0 pr-0 opacity-0 invisible"
                            }`}
                          autoFocus={isSearchOpen}
                        />

                        {/* Search Icon Button */}
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => setIsSearchOpen(!isSearchOpen)}
                          className={`absolute right-1 rounded-full transition-all duration-300 z-10 shadow-none ${isSearchOpen
                            ? "bg-transparent hover:bg-gray-700/50 border-0 h-8 w-8"
                            : "bg-transparent h-8 w-8 border-0"
                            }`}
                        >
                          <Search
                            className={`transition-all duration-300 ${isSearchOpen ? "w-4 h-4 text-purple-400 rotate-90" : "w-5 h-5 text-gray-400"
                              }`}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Content Area */}
          <div className="flex-1 p-3 md:p-4">
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
            ) : filteredStreams.length > 0 ? (
              <div
                className={`grid gap-3 md:gap-4 ${viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  : "grid-cols-1"
                  }`}
              >
                {filteredStreams.map((stream) => (
                  <StreamCard
                    key={stream.id}
                    stream={stream}
                    onJoinStream={handleJoinStream}
                    className={viewMode === "list" ? "flex-row" : ""}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-gray-700 bg-gray-800">
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
    </div>
  );
}
