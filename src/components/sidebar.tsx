"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
    HomeIcon,
    Sparkles,
    History,
    MessageCircle,
} from "lucide-react";

interface Category {
    name: string;
    icon: any;
    count: number;
    active?: boolean;
}

interface CategoryFilter {
    name: string;
    hot: boolean;
    count?: number;
}

interface SidebarProps {
    streams?: any[];
    selectedCategory?: string;
    onCategoryChange?: (category: string) => void;
}

export function Sidebar({ streams = [], selectedCategory = "Home", onCategoryChange }: SidebarProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory);

    // Update local state when prop changes
    useEffect(() => {
        setLocalSelectedCategory(selectedCategory);
    }, [selectedCategory]);

    const handleCategoryClick = (categoryName: string) => {
        if (categoryName === "All Models") {
            router.push("/m");
            return;
        }
        if (categoryName === "Recommended") {
            router.push("/recommended");
            return;
        }
        if (categoryName === "Watch History") {
            router.push("/watch-history");
            return;
        }
        setLocalSelectedCategory(categoryName);
        onCategoryChange?.(categoryName);
    };

    const categories: Category[] = [
        { name: "Home", icon: HomeIcon, count: 0, active: true },
        { name: "Recommended", icon: Sparkles, count: 0 },
        { name: "Watch History", icon: History, count: 0 },
        { name: "Private Messages", icon: MessageCircle, count: 0 },
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
        return !(category.name === "All Models" && isModel);
    });

    const categoryFilters: CategoryFilter[] = [
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

    // Only show sidebar on the home page
    if (pathname !== "/") {
        return null;
    }

    return (
        <div className="hidden lg:block left-0 h-[calc(100vh-8rem)] w-72 bg-gradient-to-b from-gray-900 via-gray-900/98 to-gray-950 backdrop-blur-md border-r border-gray-800/80 overflow-y-auto scrollbar-hide z-30 shadow-2xl">
            <div className="p-5 space-y-6">
                {/* Main Categories Section */}
                <div className="space-y-2">
                    {visibleCategories.map((category) => {
                        const IconComponent = category.icon;
                        const isActive = localSelectedCategory === category.name;

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
                            const isActive = localSelectedCategory === filter.name;

                            return (
                                <button
                                    key={filter.name}
                                    onClick={() => {
                                        setLocalSelectedCategory(filter.name);
                                        onCategoryChange?.(filter.name);
                                    }}
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
    );
}
