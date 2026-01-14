"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    Users,
    MessageCircle,
    Eye,
    Star,
    TrendingUp,
    Video,
    Clock,
    Award,
} from "lucide-react";

interface TopModel {
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
    totalViewers: number;
    totalWatchTimeHours: number;
    avgViewersPerStream: number;
    rankScore: number;
    createdAt: Date;
}

type TimePeriod = "week" | "month" | "all-time";

function TopModelsContent() {
    const { data: _session } = useSession();
    const router = useRouter();
    const [models, setModels] = useState<TopModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("week");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    const fetchTopModels = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("period", selectedPeriod);
            if (selectedCategory) params.append("category", selectedCategory);
            params.append("limit", "50");

            const response = await fetch(`/api/users/top-models?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                const modelsWithDates = (data.models || []).map((model: TopModel) => ({
                    ...model,
                    createdAt: new Date(model.createdAt),
                }));
                setModels(modelsWithDates);
            }
        } catch (error) {
            console.error("Error fetching top models:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, selectedCategory]);

    useEffect(() => {
        fetchTopModels();
    }, [fetchTopModels]);

    const handleModelClick = (modelId: string) => {
        router.push(`/m/${modelId}`);
    };

    const getPeriodLabel = (period: TimePeriod) => {
        switch (period) {
            case "week":
                return "This Week";
            case "month":
                return "This Month";
            case "all-time":
                return "All Time";
        }
    };

    const getRankBadgeColor = (rank: number) => {
        if (rank === 1) return "from-yellow-500 to-yellow-600";
        if (rank === 2) return "from-gray-400 to-gray-500";
        if (rank === 3) return "from-orange-600 to-orange-700";
        return "from-purple-600 to-purple-700";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white pt-16">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 mt-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="w-10 h-10 text-yellow-400" />
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                            Top Models
                        </h1>
                    </div>
                    <p className="text-gray-400">
                        Discover the most popular and trending models based on streams and viewer engagement
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    {/* Time Period Filter */}
                    <div className="flex gap-2">
                        {(["week", "month", "all-time"] as TimePeriod[]).map((period) => (
                            <Button
                                key={period}
                                onClick={() => setSelectedPeriod(period)}
                                variant={selectedPeriod === period ? "default" : "outline"}
                                className={
                                    selectedPeriod === period
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                        : "bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }
                            >
                                {getPeriodLabel(period)}
                            </Button>
                        ))}
                    </div>

                    {/* Category Filter */}
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
                ) : models.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {models.map((model, index) => {
                            const rank = index + 1;
                            return (
                                <Card
                                    key={model.id}
                                    className="p-0 w-full group cursor-pointer transition-all duration-200 hover:shadow-lg bg-gray-800 border border-gray-700 hover:border-purple-600 rounded-lg overflow-hidden relative"
                                    onMouseEnter={() => setHoveredCard(model.id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    onClick={() => handleModelClick(model.id)}
                                >
                                    {/* Rank Badge */}
                                    <div className="absolute top-2 left-2 z-20">
                                        <div
                                            className={`bg-gradient-to-br ${getRankBadgeColor(
                                                rank
                                            )} text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1`}
                                        >
                                            {rank <= 3 && <Award className="w-4 h-4" />}
                                            <span>#{rank}</span>
                                        </div>
                                    </div>

                                    {/* Avatar with fixed height */}
                                    <div className="relative w-full h-48 sm:h-52 md:h-56 lg:h-60 bg-gray-700 overflow-hidden">
                                        {model.avatarUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={model.avatarUrl}
                                                alt={model.displayName}
                                                className="w-full h-full object-cover object-center"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-gray-800 flex flex-col items-center justify-center">
                                                <Users className="w-12 h-12 text-gray-500 mb-2" />
                                                <div className="text-xs text-gray-500 text-center px-4">
                                                    <div className="font-medium truncate">
                                                        {model.displayName}
                                                    </div>
                                                    {model.category && (
                                                        <div className="text-purple-400 mt-1">
                                                            {model.category}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Category Badge */}
                                        {model.category && (
                                            <div className="absolute top-2 right-2 z-10">
                                                <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                                                    {model.category}
                                                </div>
                                            </div>
                                        )}

                                        {/* Stats Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-10">
                                            <div className="grid grid-cols-3 gap-2 text-xs text-white">
                                                <div className="flex items-center gap-1" title="Total Streams">
                                                    <Video className="w-3 h-3 text-purple-400" />
                                                    <span className="font-semibold">{model.streamsCount}</span>
                                                </div>
                                                <div className="flex items-center gap-1" title="Total Viewers">
                                                    <Eye className="w-3 h-3 text-blue-400" />
                                                    <span className="font-semibold">{model.totalViewers}</span>
                                                </div>
                                                <div className="flex items-center gap-1" title="Watch Time (hours)">
                                                    <Clock className="w-3 h-3 text-green-400" />
                                                    <span className="font-semibold">{model.totalWatchTimeHours}h</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Age Badge */}
                                        {model.displayedAge && (
                                            <div className="absolute bottom-14 left-3 z-10">
                                                <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold">
                                                    {model.displayedAge}
                                                </div>
                                            </div>
                                        )}

                                        {/* Hover Overlay */}
                                        <div
                                            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 z-10 ${hoveredCard === model.id ? "opacity-100" : "opacity-0"
                                                }`}
                                        >
                                            <div className="w-16 h-16 bg-purple-600/50 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-purple-500/70">
                                                <MessageCircle className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    <CardContent className="px-4 pb-4">
                                        <h3 className="font-semibold text-base mb-2 line-clamp-2 text-white group-hover:text-purple-400 transition-colors">
                                            {model.displayName}
                                        </h3>

                                        <div className="flex items-center gap-2 mb-2">
                                            {model.displayedCity && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-purple-400" />
                                                    <span className="text-xs text-gray-400 truncate">
                                                        {model.displayedCity}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Performance Stats */}
                                        <div className="bg-gray-900/50 rounded-lg p-2 mb-2 space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400">Followers</span>
                                                <span className="text-white font-semibold flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3 text-green-400" />
                                                    {model.followersCount}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400">Avg Viewers</span>
                                                <span className="text-white font-semibold">
                                                    {model.avgViewersPerStream}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        {model.bio && (
                                            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                                                {model.bio}
                                            </p>
                                        )}

                                        {/* Tags */}
                                        {(model.ethnicity || model.physique || model.hairColor) && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {model.ethnicity && (
                                                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs border border-gray-600/50">
                                                        {model.ethnicity}
                                                    </span>
                                                )}
                                                {model.physique && (
                                                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs border border-gray-600/50">
                                                        {model.physique}
                                                    </span>
                                                )}
                                                {model.hairColor && (
                                                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs border border-gray-600/50">
                                                        {model.hairColor}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Languages */}
                                        {model.spokenLanguages.length > 0 && (
                                            <div className="flex items-center gap-1 mb-2">
                                                <span className="text-xs font-medium text-purple-400 bg-purple-600/20 px-2 py-1 rounded-full border border-purple-500/30">
                                                    {model.spokenLanguages.slice(0, 2).join(", ")}
                                                    {model.spokenLanguages.length > 2 && "..."}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center">
                                            <Button
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleModelClick(model.id);
                                                }}
                                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                            >
                                                <Star className="w-4 h-4 mr-1 fill-white" />
                                                View Profile
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="border-2 border-dashed border-gray-700 bg-gray-800/50">
                        <CardContent className="p-12 text-center">
                            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Top Models Found</h3>
                            <p className="text-gray-400">
                                No models have streamed during this period. Check back later!
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default function TopModelsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white pt-16 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        }>
            <TopModelsContent />
        </Suspense>
    );
}
