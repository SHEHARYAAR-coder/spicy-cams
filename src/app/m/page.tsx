"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Users,
  Heart,
  Camera,
  MessageCircle,
  Eye,
  Star,
} from "lucide-react";
import Image from "next/image";

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
  const { data: session } = useSession();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);

      const response = await fetch(`/api/users/creators?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const creatorsWithDates = (data.creators || []).map((creator: any) => ({
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
                className="group text-white bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-lg hover:shadow-purple-500/20"
                onClick={() => handleCreatorClick(creator.id)}
              >
                <CardContent className="p-0">
                  {/* Avatar */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                    {creator.avatarUrl ? (
                      <Image
                        src={creator.avatarUrl}
                        alt={creator.displayName}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-20 h-20 text-gray-600" />
                      </div>
                    )}
                    {/* Category Badge */}
                    {creator.category && (
                      <Badge className="absolute top-2 left-2 bg-purple-600/90 text-white">
                        {creator.category}
                      </Badge>
                    )}
                    {/* Age Badge */}
                    {creator.displayedAge && (
                      <Badge className="absolute top-2 right-2 bg-gray-900/90 text-white">
                        {creator.displayedAge}
                      </Badge>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-purple-400 transition-colors">
                      {creator.displayName}
                    </h3>

                    {/* Location */}
                    {creator.displayedCity && (
                      <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{creator.displayedCity}</span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{creator.followersCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span>{creator.streamsCount}</span>
                      </div>
                    </div>

                    {/* Bio Preview */}
                    {creator.bio && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                        {creator.bio}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {creator.ethnicity && (
                        <Badge
                          variant="outline"
                          className="text-xs border-gray-600 text-gray-300"
                        >
                          {creator.ethnicity}
                        </Badge>
                      )}
                      {creator.physique && (
                        <Badge
                          variant="outline"
                          className="text-xs border-gray-600 text-gray-300"
                        >
                          {creator.physique}
                        </Badge>
                      )}
                      {creator.hairColor && (
                        <Badge
                          variant="outline"
                          className="text-xs border-gray-600 text-gray-300"
                        >
                          {creator.hairColor}
                        </Badge>
                      )}
                    </div>

                    {/* Languages */}
                    {creator.spokenLanguages.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {creator.spokenLanguages.slice(0, 2).join(", ")}
                        {creator.spokenLanguages.length > 2 && "..."}
                      </div>
                    )}

                    {/* View Profile Button */}
                    <Button
                      className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                      size="sm"
                    >
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
