"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MapPin,
  Users,
  MessageCircle,
  Eye,
  Star,
} from "lucide-react";

interface Creator {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  category?: string;
  language?: string;
  hairColor?: string;
  physique?: string;
  breastSize?: string;
  displayedAge?: number;
  spokenLanguages: string[];
  relationship?: string;
  ethnicity?: string;
  displayedCity?: string;
  myShows: string[];
  followersCount: number;
  streamsCount: number;
  createdAt: Date;
}

export default function ModelsPage() {
  const { data: _session } = useSession();
  const router = useRouter();
  const [_creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);

      const response = await fetch(`/api/users/creators?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const creatorsWithDates = (data.creators || []).map((creator: Creator) => ({
          ...creator,
          createdAt: new Date(creator.createdAt),
        }));
        setCreators(creatorsWithDates);
        setFilteredCreators(creatorsWithDates);
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [searchQuery, selectedCategory]);

  const handleCreatorClick = (creatorId: string) => {
    router.push(`/m/${creatorId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            All Models
          </h1>
          <p className="text-gray-400">
            Discover and connect with our talented creators
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search models by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800/80 border-gray-700 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-800/80 border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Categories</option>
            <option value="Asian">Asian</option>
            <option value="BDSM">BDSM</option>
            <option value="Big Cock">Big Cock</option>
            <option value="Big Tits">Big Tits</option>
            <option value="Black">Black</option>
            <option value="Huge Tits">Huge Tits</option>
            <option value="Latino">Latino</option>
            <option value="Mature">Mature</option>
            <option value="Teen 18+">Teen 18+</option>
          </select>
        </div>

        {/* Models Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <Card
                key={i}
                className="animate-pulse bg-gray-800 border-gray-700 text-white"
              >
                <CardContent className="p-0 text-white">
                  <div className="aspect-square bg-gray-700 rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCreators.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredCreators.map((creator) => (
              <Card
                key={creator.id}
                className="p-0 w-full group cursor-pointer transition-all duration-200 hover:shadow-lg bg-gray-800 border border-gray-700 hover:border-purple-600 rounded-lg overflow-hidden"
                onMouseEnter={() => setHoveredCard(creator.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCreatorClick(creator.id)}
              >
                {/* Avatar with fixed height */}
                <div className="relative w-full h-48 sm:h-52 md:h-56 lg:h-60 bg-gray-700 overflow-hidden">
                  {creator.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={creator.avatarUrl}
                      alt={creator.displayName}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-gray-800 flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-gray-500 mb-2" />
                      <div className="text-xs text-gray-500 text-center px-4">
                        <div className="font-medium truncate">{creator.displayName}</div>
                        {creator.category && (
                          <div className="text-purple-400 mt-1">{creator.category}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Category Badge */}
                  {creator.category && (
                    <div className="absolute top-3 left-3 z-10">
                      <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {creator.category}
                      </div>
                    </div>
                  )}

                  {/* Star Rating */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="absolute bottom-3 right-3 z-10">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {creator.followersCount}
                    </div>
                  </div>

                  {/* Age Badge */}
                  {creator.displayedAge && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold">
                        {creator.displayedAge}
                      </div>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
                      hoveredCard === creator.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div className="w-16 h-16 bg-purple-600/50 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-purple-500/70">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>

                <CardContent className="px-4 pb-4">
                  <h3 className="font-semibold text-base mb-2 line-clamp-2 text-white group-hover:text-purple-400 transition-colors">
                    {creator.displayName}
                  </h3>

                  <div className="flex items-center gap-2 mb-2">
                    {creator.displayedCity && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-gray-400 truncate">{creator.displayedCity}</span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {creator.bio && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                      {creator.bio}
                    </p>
                  )}

                  {/* Tags */}
                  {(creator.ethnicity || creator.physique || creator.hairColor) && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {creator.ethnicity && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs border border-gray-600/50">
                          {creator.ethnicity}
                        </span>
                      )}
                      {creator.physique && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs border border-gray-600/50">
                          {creator.physique}
                        </span>
                      )}
                      {creator.hairColor && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs border border-gray-600/50">
                          {creator.hairColor}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Languages */}
                  {creator.spokenLanguages.length > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs font-medium text-purple-400 bg-purple-600/20 px-2 py-1 rounded-full border border-purple-500/30">
                        {creator.spokenLanguages.slice(0, 2).join(", ")}
                        {creator.spokenLanguages.length > 2 && "..."}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreatorClick(creator.id);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-gray-700 bg-gray-800/50">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Models Found</h3>
              <p className="text-gray-400">
                {searchQuery
                  ? "No models match your search criteria."
                  : "No models available at the moment."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
