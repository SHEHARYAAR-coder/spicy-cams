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
  RefreshCw,
  Play,
  Star,
  MapPin,
  Calendar,
  Heart,
  Languages,
  Filter,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  Eye,
  Flame,
  MessageCircle,
  DollarSign,
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
  creator: {
    id: string;
    name: string;
    image?: string;
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };
  const categories = [
    { name: "All Girls Cams", icon: Heart, count: 0, active: true },
    { name: "Private Messages", icon: MessageCircle, count: 0 },
    // { name: "New Models", icon: Star, count: 0 },
    // { name: "GOLD Shows", icon: Star, count: 0 },
  ];

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
        const streamsWithDates = (data.streams || []).map((stream: any) => ({
          ...stream,
          createdAt: new Date(stream.createdAt),
          creator: {
            ...stream.creator,
            image: stream.creator.avatar, // Map avatar to image for consistency
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
          stream.creator.name
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
        <div className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700/50 p-4 overflow-y-auto scrollbar-hide z-40 shadow-xl">
          {/* Main Categories */}
          <div className="mb-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isCreator = !!(
                session?.user &&
                // common possible flags for "creator" role
                ((session.user as any).isCreator ||
                  (session.user as any).role === "CREATOR" ||
                  (Array.isArray((session.user as any).roles) &&
                    (session.user as any).roles.includes("CREATOR")))
              );

              return (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-all neon-hover ${selectedCategory === category.name
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                    : "text-gray-300 hover:bg-gray-800/80"
                    }`}
                >
                  <IconComponent
                    className={`w-5 h-5 ${selectedCategory === category.name
                      ? "neon-purple-icon"
                      : "neon-target-icon"
                      }`}
                  />
                  <span
                    className={`font-medium ${selectedCategory === category.name
                      ? "neon-purple-text"
                      : "neon-target-text"
                      }`}
                  >
                    {category.name}
                  </span>
                  {category.name === "All Girls Cams" && (
                    <div className="w-2 h-2 bg-purple-400 rounded-full ml-auto" />
                  )}
                  {category.name === "Private Messages" && (
                    <div className="w-2 h-2 bg-green-400 rounded-full ml-auto animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Category Pages */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              Categories
            </h3>
            <div className="space-y-1">
              {categoryCounts.map((filter) => (
                <button
                  key={filter.name}
                  onClick={() => setSelectedCategory(filter.name)}
                  className={`w-full flex items-center justify-between p-2 rounded text-sm transition-all neon-hover ${selectedCategory === filter.name
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                    : "text-gray-300 hover:bg-gray-800/80"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`${selectedCategory === filter.name
                        ? "neon-purple-text"
                        : "neon-target-text"
                        }`}
                    >
                      {filter.name}
                    </span>
                    {filter.hot && (
                      <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 neon-red-badge">
                        hot
                      </Badge>
                    )}
                  </span>
                  <span className="text-gray-400 text-xs">{filter.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Full width on mobile, offset on desktop */}
        <div className="flex-1 flex flex-col lg:ml-64">
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
