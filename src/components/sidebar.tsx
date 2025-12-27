"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
    HomeIcon,
    History,
    MessageCircle,
    Heart,
    Image,
    ThumbsUp,
    Grid3x3,
} from "lucide-react";
import { useCategoryType } from "@/contexts/CategoryContext";

interface Category {
    name: string;
    icon: any;
    count: number;
    active?: boolean;
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
    const { selectedCategoryType, showCategoryBar } = useCategoryType();
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
        { name: "Gallery", icon: Image, count: 0 },
        { name: "Recommended", icon: ThumbsUp, count: 0 },
        { name: "My Favorites", icon: Heart, count: 0 },
        { name: "Best for Privates", icon: MessageCircle, count: 0 },
        { name: "Watch History", icon: History, count: 0 },
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

    // Filter categories based on user role and login status
    const visibleCategories = categories.filter(category => {
        if (category.name === "All Models" && isModel) return false;
        if (!session && (category.name === "My Favorites" || category.name === "Best for Privates")) return false;
        return true;
    });

    // ==================== GIRLS CATEGORIES ====================
    const girlsSpecials = [
        { name: "XXXmas", emoji: "🎄", count: 525 },
        { name: "Ukrainian", emoji: "🇺🇦", count: 131 },
        { name: "New Models", emoji: "⚡", count: 1047 },
        { name: "VR Cams", emoji: "🥽", count: 180 },
        { name: "BDSM", emoji: "⛓️", count: 83 },
        { name: "Ticket Shows", emoji: "🎫", count: 172 },
    ];

    const girlsAge = [
        { name: "Teen 18+", count: 1619 },
        { name: "Young 22+", count: 3947 },
        { name: "MILF", count: 1430 },
        { name: "Mature", count: 261 },
        { name: "Granny", count: 42 },
    ];

    const girlsEthnicity = [
        { name: "Arab", count: 149 },
        { name: "Asian", count: 888 },
        { name: "Ebony", count: 546 },
        { name: "Indian", count: 320 },
        { name: "Latina", count: 3389 },
        { name: "Mixed", count: 181 },
        { name: "White", count: 2320 },
    ];

    const girlsBodyType = [
        { name: "Skinny", count: 2760 },
        { name: "Athletic", count: 687 },
        { name: "Medium", count: 2414 },
        { name: "Curvy", count: 1575 },
        { name: "BBW", count: 383 },
    ];

    const girlsHair = [
        { name: "Blonde", count: 1288 },
        { name: "Black", count: 2275 },
        { name: "Brunette", count: 2586 },
        { name: "Redhead", count: 608 },
        { name: "Colorful", count: 334 },
    ];

    const girlsPrivateShows = [
        { name: "8-12 tk", count: 3600 },
        { name: "16-24 tk", count: 2179 },
        { name: "32-60 tk", count: 1498 },
        { name: "90+ tk", count: 402 },
        { name: "Recordable Privates", count: 5557 },
        { name: "Spy on Shows", count: 444 },
        { name: "Video Call (Cam2Cam)", count: 7232 },
    ];

    const girlsPopular = [
        { name: "Interactive Toy", emoji: "📳", count: 4598 },
        { name: "Mobile", emoji: "📱", count: 1374 },
        { name: "Group Sex", count: 104 },
        { name: "Big Tits", count: 3332 },
        { name: "Hairy Pussy", count: 1213 },
        { name: "Outdoor", count: 1133 },
        { name: "Big Ass", count: 4732 },
        { name: "Anal", emoji: "🔥", count: 2883 },
        { name: "Squirt", count: 3520 },
        { name: "Fuck Machine", emoji: "🔥", count: 842 },
        { name: "Hardcore", count: 251 },
        { name: "Pregnant", count: 44 },
        { name: "Blowjob", emoji: "🔥", count: 5582 },
        { name: "Small Tits", count: 2604 },
        { name: "Fisting", count: 814 },
        { name: "Masturbation", count: 6231 },
        { name: "Shaven", count: 4331 },
        { name: "Deepthroat", emoji: "🔥", count: 4649 },
        { name: "Office", count: 1227 },
        { name: "Foot Fetish", emoji: "🔥", count: 5077 },
    ];

    // ==================== COUPLES CATEGORIES ====================
    const couplesSpecials = [
        { name: "XXXmas", emoji: "🎄", count: 26 },
        { name: "Ukrainian", emoji: "🇺🇦", count: 4 },
        { name: "New Models", emoji: "⚡", count: 82 },
        { name: "VR Cams", emoji: "🥽", count: 3 },
        { name: "Ticket Shows", emoji: "🎫", count: 32 },
    ];

    const couplesPrivateShows = [
        { name: "8-12 tk", count: 125 },
        { name: "16-24 tk", count: 135 },
        { name: "32-60 tk", count: 152 },
        { name: "90+ tk", count: 67 },
        { name: "Recordable Privates", count: 391 },
        { name: "Spy on Shows", count: 22 },
        { name: "Video Call (Cam2Cam)", count: 440 },
    ];

    const couplesPopular = [
        { name: "Interactive Toy", emoji: "📳", count: 204 },
        { name: "Mobile", emoji: "📱", count: 145 },
        { name: "Group Sex", count: 103 },
        { name: "Outdoor", count: 123 },
        { name: "Anal", emoji: "🔥", count: 225 },
        { name: "Squirt", count: 196 },
        { name: "Fuck Machine", emoji: "🔥", count: 43 },
        { name: "Hardcore", count: 250 },
        { name: "Pregnant", count: 6 },
        { name: "Blowjob", emoji: "🔥", count: 383 },
        { name: "Fisting", count: 78 },
        { name: "Masturbation", count: 392 },
        { name: "Doggy Style", emoji: "🔥", count: 411 },
        { name: "Deepthroat", emoji: "🔥", count: 345 },
        { name: "Office", count: 67 },
        { name: "Foot Fetish", emoji: "🔥", count: 329 },
        { name: "Dildo or Vibrator", count: 341 },
        { name: "69 Position", count: 218 },
        { name: "Jerk-off Instruction", count: 146 },
        { name: "Old & Young 22+", count: 45 },
    ];

    // ==================== GUYS CATEGORIES ====================
    const guysSpecials = [
        { name: "XXXmas", emoji: "🎄", count: 21 },
        { name: "Ukrainian", emoji: "🇺🇦", count: 6 },
        { name: "New Models", emoji: "⚡", count: 169 },
        { name: "VR Cams", emoji: "🥽", count: 2 },
        { name: "Ticket Shows", emoji: "🎫", count: 19 },
    ];

    const guysOrientation = [
        { name: "Bisexual", count: 790 },
        { name: "Gay", count: 135 },
        { name: "Straight", count: 176 },
    ];

    const guysAge = [
        { name: "Twink", count: 186 },
        { name: "Young 22+", count: 579 },
        { name: "Daddy", count: 167 },
        { name: "Mature", count: 47 },
        { name: "Grandpa", count: 24 },
    ];

    const guysEthnicity = [
        { name: "Arab", count: 16 },
        { name: "Asian", count: 109 },
        { name: "Ebony", count: 60 },
        { name: "Indian", count: 71 },
        { name: "Latin", count: 473 },
        { name: "Mixed", count: 61 },
        { name: "White", count: 339 },
    ];

    const guysBodyType = [
        { name: "Skinny", count: 276 },
        { name: "Muscular", count: 364 },
        { name: "Medium", count: 358 },
        { name: "Chunky", count: 57 },
        { name: "Big", count: 34 },
    ];

    const guysHair = [
        { name: "Blond", count: 104 },
        { name: "Black", count: 363 },
        { name: "Brunet", count: 386 },
        { name: "Redhead", count: 17 },
        { name: "Colorful", count: 20 },
    ];

    const guysPrivateShows = [
        { name: "8-12 tk", count: 407 },
        { name: "16-24 tk", count: 440 },
        { name: "32-60 tk", count: 192 },
        { name: "90+ tk", count: 42 },
        { name: "Recordable Privates", count: 766 },
        { name: "Spy on Shows", count: 36 },
        { name: "Video Call (Cam2Cam)", count: 1055 },
    ];

    const guysPopular = [
        { name: "Interactive Toy", emoji: "📳", count: 272 },
        { name: "Mobile", emoji: "📱", count: 328 },
        { name: "Group Sex", count: 23 },
        { name: "Outdoor", count: 192 },
        { name: "Big Ass", count: 293 },
        { name: "Anal", emoji: "🔥", count: 481 },
        { name: "Fuck Machine", emoji: "🔥", count: 21 },
        { name: "Hardcore", count: 11 },
        { name: "Blowjob", emoji: "🔥", count: 337 },
        { name: "Big Nipples", count: 2 },
        { name: "Fisting", count: 87 },
        { name: "Masturbation", count: 911 },
        { name: "Doggy Style", emoji: "🔥", count: 576 },
        { name: "Hairy armpits", count: 139 },
        { name: "Creampie", count: 51 },
        { name: "Shaven", count: 278 },
        { name: "Shower", count: 363 },
        { name: "Deepthroat", emoji: "🔥", count: 309 },
        { name: "Office", count: 162 },
        { name: "Foot Fetish", emoji: "🔥", count: 497 },
    ];

    // ==================== TRANS CATEGORIES ====================
    const transSpecials = [
        { name: "XXXmas", emoji: "🎄", count: 9 },
        { name: "New Models", emoji: "⚡", count: 55 },
        { name: "VR Cams", emoji: "🥽", count: 2 },
        { name: "Ticket Shows", emoji: "🎫", count: 11 },
    ];

    const transAge = [
        { name: "Teen 18+", count: 123 },
        { name: "Young 22+", count: 322 },
        { name: "MILF", count: 58 },
        { name: "Mature", count: 6 },
        { name: "Granny", count: 2 },
    ];

    const transEthnicity = [
        { name: "Arab", count: 2 },
        { name: "Asian", count: 156 },
        { name: "Ebony", count: 20 },
        { name: "Indian", count: 1 },
        { name: "Latina", count: 304 },
        { name: "Mixed", count: 14 },
        { name: "White", count: 77 },
    ];

    const transBodyType = [
        { name: "Skinny", count: 307 },
        { name: "Athletic", count: 47 },
        { name: "Medium", count: 136 },
        { name: "Curvy", count: 70 },
        { name: "BBW", count: 11 },
    ];

    const transHair = [
        { name: "Blonde", count: 83 },
        { name: "Black", count: 177 },
        { name: "Brunette", count: 179 },
        { name: "Redhead", count: 27 },
        { name: "Colorful", count: 33 },
    ];

    const transPrivateShows = [
        { name: "8-12 tk", count: 222 },
        { name: "16-24 tk", count: 224 },
        { name: "32-60 tk", count: 114 },
        { name: "90+ tk", count: 11 },
        { name: "Recordable Privates", count: 502 },
        { name: "Spy on Shows", count: 16 },
        { name: "Video Call (Cam2Cam)", count: 552 },
    ];

    const transPopular = [
        { name: "Interactive Toy", emoji: "📳", count: 240 },
        { name: "Mobile", emoji: "📱", count: 32 },
        { name: "Group Sex", count: 19 },
        { name: "Big Tits", count: 124 },
        { name: "Outdoor", count: 81 },
        { name: "Big Ass", count: 307 },
        { name: "Anal", emoji: "🔥", count: 447 },
        { name: "Squirt", count: 149 },
        { name: "Big Clit", count: 57 },
        { name: "Fuck Machine", emoji: "🔥", count: 28 },
        { name: "Hardcore", count: 16 },
        { name: "Blowjob", emoji: "🔥", count: 393 },
        { name: "Small Tits", count: 219 },
        { name: "Big Nipples", count: 107 },
        { name: "Fisting", count: 96 },
        { name: "Masturbation", count: 469 },
        { name: "Doggy Style", emoji: "🔥", count: 483 },
        { name: "Hairy armpits", count: 25 },
        { name: "Creampie", count: 159 },
        { name: "Shaven", count: 249 },
    ];

    // Only show sidebar on the home page
    if (pathname !== "/") {
        return null;
    }

    // Render category section helper
    const renderCategorySection = (title: string, items: { name: string; count: number; emoji?: string }[], showEmoji = false) => (
        <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
                {title}
            </h3>
            <div className="space-y-0.5">
                {items.map((item) => {
                    const isActive = localSelectedCategory === item.name;
                    return (
                        <button
                            key={item.name}
                            onClick={() => {
                                setLocalSelectedCategory(item.name);
                                onCategoryChange?.(item.name);
                            }}
                            className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isActive
                                ? "bg-purple-600/90 text-white"
                                : "text-white hover:bg-gray-800/50"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                {showEmoji && item.emoji && <span>{item.emoji}</span>}
                                <span className="font-medium">{item.name}</span>
                            </span>
                            <span className="text-sm font-medium text-gray-400">
                                {item.count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // Render category-specific sections based on selected type
    const renderCategorySpecificSections = () => {
        switch (selectedCategoryType) {
            case "girls":
                return (
                    <>
                        {renderCategorySection("Specials", girlsSpecials, true)}
                        {renderCategorySection("Age", girlsAge)}
                        {renderCategorySection("Ethnicity", girlsEthnicity)}
                        {renderCategorySection("Body Type", girlsBodyType)}
                        {renderCategorySection("Hair", girlsHair)}
                        {renderCategorySection("Private Shows", girlsPrivateShows)}
                        {renderCategorySection("Popular", girlsPopular, true)}
                    </>
                );
            case "couples":
                return (
                    <>
                        {renderCategorySection("Specials", couplesSpecials, true)}
                        {renderCategorySection("Private Shows", couplesPrivateShows)}
                        {renderCategorySection("Popular", couplesPopular, true)}
                    </>
                );
            case "guys":
                return (
                    <>
                        {renderCategorySection("Specials", guysSpecials, true)}
                        {renderCategorySection("Orientation", guysOrientation)}
                        {renderCategorySection("Age", guysAge)}
                        {renderCategorySection("Ethnicity", guysEthnicity)}
                        {renderCategorySection("Body Type", guysBodyType)}
                        {renderCategorySection("Hair", guysHair)}
                        {renderCategorySection("Private Shows", guysPrivateShows)}
                        {renderCategorySection("Popular", guysPopular, true)}
                    </>
                );
            case "trans":
                return (
                    <>
                        {renderCategorySection("Specials", transSpecials, true)}
                        {renderCategorySection("Age", transAge)}
                        {renderCategorySection("Ethnicity", transEthnicity)}
                        {renderCategorySection("Body Type", transBodyType)}
                        {renderCategorySection("Hair", transHair)}
                        {renderCategorySection("Private Shows", transPrivateShows)}
                        {renderCategorySection("Popular", transPopular, true)}
                    </>
                );
            default:
                return (
                    <>
                        {renderCategorySection("Specials", girlsSpecials, true)}
                        {renderCategorySection("Age", girlsAge)}
                        {renderCategorySection("Ethnicity", girlsEthnicity)}
                        {renderCategorySection("Body Type", girlsBodyType)}
                        {renderCategorySection("Hair", girlsHair)}
                        {renderCategorySection("Private Shows", girlsPrivateShows)}
                        {renderCategorySection("Popular", girlsPopular, true)}
                    </>
                );
        }
    };

    return (
        <div className={`hidden lg:block fixed left-0 bottom-0 w-56 bg-gradient-to-b from-gray-900 via-gray-900/98 to-gray-950 backdrop-blur-md border-r border-gray-800/80 overflow-y-auto scrollbar-hide z-30 shadow-2xl transition-all duration-300 ${showCategoryBar ? 'top-[6.5rem]' : 'top-[4rem]'}`}>
            <div className="p-4 space-y-5">
                {/* Main Categories Section */}
                <div className="space-y-1">
                    {visibleCategories.map((category) => {
                        const IconComponent = category.icon;
                        const isActive = localSelectedCategory === category.name;

                        return (
                            <button
                                key={category.name}
                                onClick={() => handleCategoryClick(category.name)}
                                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden ${isActive
                                    ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30"
                                    : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
                                    }`}
                            >
                                <IconComponent className={`w-5 h-5`} />
                                <span className={`font-semibold text-sm`}>
                                    {category.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Category-specific sections */}
                {renderCategorySpecificSections()}

                {/* All Categories Button */}
                <div className="pt-4 pb-2">
                    <button
                        onClick={() => router.push(`/tags/${selectedCategoryType}`)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full border-2 border-gray-700 hover:border-purple-500 text-white font-medium transition-all duration-200 hover:bg-gray-800/50"
                    >
                        <Grid3x3 className="w-4 h-4" />
                        <span className="text-sm">ALL CATEGORIES</span>
                    </button>
                </div>

                {/* Bottom Spacer */}
                <div className="h-4" />
            </div>
        </div>
    );
}
