"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Heart,
  Calendar,
  User,
  MessageCircle,
  Video,
  Globe,
  Activity,
  Sparkles,
  Share2,
  PlayCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { StreamCard } from "@/components/stream";

// --- Interfaces (Kept same as original) ---
interface Stream {
  id: string;
  title: string;
  description: string;
  status: "LIVE" | "SCHEDULED" | "ENDED";
  category?: string;
  tags?: string[];
  thumbnailUrl?: string;
  createdAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
}

interface Creator {
  id: string;
  email: string;
  role: string;
  status: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  category?: string;
  language?: string;
  hairColor?: string;
  physique?: string;
  breastSize?: string;
  pubicHair?: string;
  displayedAge?: number;
  spokenLanguages: string[];
  relationship?: string;
  ethnicity?: string;
  piercings?: string;
  tattoos?: string;
  displayedCity?: string;
  myShows: string[];
  profileDescription?: string;
  profileImages: string[];
  profileVideos: string[];
  followersCount: number;
  streamsCount: number;
  createdAt: Date;
  streams: Stream[];
}

export default function CreatorProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const creatorId = params.creatorId as string;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const fetchCreator = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/creators/${creatorId}`);
      if (response.ok) {
        const data = await response.json();
        const creatorWithDates = {
          ...data.creator,
          createdAt: new Date(data.creator.createdAt),
          streams: (data.creator.streams || []).map((stream: any) => ({
            ...stream,
            createdAt: new Date(stream.createdAt),
            scheduledAt: stream.scheduledAt
              ? new Date(stream.scheduledAt)
              : null,
            startedAt: stream.startedAt ? new Date(stream.startedAt) : null,
          })),
        };
        setCreator(creatorWithDates);
      } else {
        router.push("/m");
      }
    } catch (error) {
      console.error("Error fetching creator:", error);
      router.push("/m");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (creatorId) {
      fetchCreator();
    }
  }, [creatorId]);

  const handleFollowToggle = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setIsFollowing(!isFollowing);
  };

  const handleJoinStream = (streamId: string) => {
    if (!session) {
      window.location.href = `/login?callbackUrl=/streaming?join=${streamId}`;
    } else {
      window.location.href = `/streaming?join=${streamId}`;
    }
  };

  const handleMessage = () => {
    if (!session) {
      router.push("/login");
      return;
    }
    router.push(`/profile?message=${creatorId}`);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleClosePreview = () => {
    setSelectedImageIndex(null);
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && creator) {
      setSelectedImageIndex((selectedImageIndex - 1 + creator.profileImages.length) % creator.profileImages.length);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && creator) {
      setSelectedImageIndex((selectedImageIndex + 1) % creator.profileImages.length);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;

      if (e.key === "Escape") {
        handleClosePreview();
      } else if (e.key === "ArrowLeft") {
        handlePreviousImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, creator]);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-400 font-medium tracking-wide animate-pulse">
            LOADING PROFILE...
          </p>
        </div>
      </div>
    );
  }

  if (!creator) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-x-hidden selection:bg-purple-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-pink-900/10 rounded-full blur-[120px] opacity-30" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative z-10">
        {/* Navigation Bar */}
        {/* <div className="sticky top-0 z-50 backdrop-blur-md bg-gray-900/50 border-b border-gray-700">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Link href="/m">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-800/80 gap-2 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Models
              </Button>
            </Link>
          </div>
        </div> */}

        {/* Hero / Cover Section */}
        <div className="relative">
          {/* Simulated Cover Image */}
          <div className="h-[300px] w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/50 to-gray-950" />
            {creator.avatarUrl ? (
              <Image
                src={creator.avatarUrl}
                alt="Cover"
                fill
                className="object-cover opacity-40 blur-xl scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-900 via-black to-pink-900" />
            )}
          </div>

          {/* Profile Header Content */}
          <div className="container mx-auto px-4 -mt-32 relative">
            <div className="flex flex-col md:flex-row items-end md:items-end gap-6 md:gap-8">
              {/* Avatar */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500 to-violet-600 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-gray-950 overflow-hidden bg-gray-800 shadow-2xl">
                  {creator.avatarUrl ? (
                    <Image
                      src={creator.avatarUrl}
                      alt={creator.displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <User className="w-20 h-20 text-gray-600" />
                    </div>
                  )}
                </div>
                {creator.status === "LIVE" && (
                  <div className="absolute bottom-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-4 border-gray-950 shadow-lg animate-pulse">
                    LIVE
                  </div>
                )}
              </div>

              {/* Name & Quick Actions */}
              <div className="flex-1 pb-2 w-full md:w-auto text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                    {creator.displayName}
                  </h1>
                  {creator.displayedAge && (
                    <Badge variant="outline" className="w-fit mx-auto md:mx-0 border-gray-600 text-gray-300 bg-gray-800/50">
                      {creator.displayedAge}
                    </Badge>
                  )}
                  {creator.category && (
                    <Badge className="w-fit mx-auto md:mx-0 bg-purple-600 text-white border-0">
                      {creator.category}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400 text-sm mb-6">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold">
                      {creator.followersCount.toLocaleString()}
                    </span>{" "}
                    Followers
                  </div>
                  <div className="w-1 h-1 bg-gray-600 rounded-full" />
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold">
                      {creator.streamsCount}
                    </span>{" "}
                    Streams
                  </div>
                  {creator.displayedCity && (
                    <>
                      <div className="w-1 h-1 bg-gray-600 rounded-full" />
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {creator.displayedCity}
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Button
                    onClick={handleFollowToggle}
                    className={`min-w-[140px] transition-all duration-300 ${isFollowing
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                      }`}
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 transition-colors ${isFollowing ? "fill-pink-500 text-pink-500" : ""
                        }`}
                    />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button
                    onClick={handleMessage}
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Sidebar: Info & Attributes */}
            <div className="lg:col-span-4 space-y-6">
              {/* About Card */}
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    About Me
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {creator.bio || "No bio available."}
                  </p>
                </div>

                {creator.spokenLanguages.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {creator.spokenLanguages.map((lang) => (
                        <div key={lang} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-xs text-purple-300">
                          <Globe className="w-3 h-3" />
                          {lang}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats / Bento Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <AttributeBox label="Ethnicity" value={creator.ethnicity} />
                  <AttributeBox label="Hair" value={creator.hairColor} />
                  <AttributeBox label="Body" value={creator.physique} />
                  <AttributeBox label="Eye Color" value="--" />
                  <AttributeBox label="Tattoos" value={creator.tattoos} />
                  <AttributeBox label="Joined" value={new Date(creator.createdAt).getFullYear().toString()} icon={<Calendar className="w-3 h-3" />} />
                </div>
              </div>

              {/* My Shows */}
              {creator.myShows.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-pink-500" />
                    My Shows
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {creator.myShows.map((show) => (
                      <Badge
                        key={show}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 py-1.5"
                      >
                        {show}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Content: Description & Streams */}
            <div className="lg:col-span-8 space-y-8">

              {/* Profile Description (Long) */}
              {creator.profileDescription && (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {creator.profileDescription}
                  </p>
                </div>
              )}

              {/* Media Gallery */}
              {(creator.profileImages.length > 0 || creator.profileVideos.length > 0) && (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    Media Gallery
                  </h2>

                  {/* Images Section */}
                  {creator.profileImages.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Photos</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {creator.profileImages.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="relative group aspect-square overflow-hidden rounded-xl bg-gray-900 cursor-pointer"
                            onClick={() => handleImageClick(index)}
                          >
                            <Image
                              src={imageUrl}
                              alt={`${creator.displayName} photo ${index + 1}`}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                <Sparkles className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos Section */}
                  {creator.profileVideos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Videos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {creator.profileVideos.map((videoUrl, index) => (
                          <div
                            key={index}
                            className="relative group rounded-xl overflow-hidden bg-gray-900"
                          >
                            <video
                              src={videoUrl}
                              className="w-full h-auto rounded-xl"
                              controls
                              preload="metadata"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Streams Tab Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                      <Video className="w-6 h-6" />
                    </div>
                    Latest Streams
                  </h2>
                  {/* Optional View All button could go here */}
                </div>

                {creator.streams.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {creator.streams.map((stream) => (
                      <div key={stream.id} className="group relative">
                        {/* Custom wrapper for StreamCard to add hover effects */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-30 transition duration-300 blur-sm"></div>
                        <div className="relative">
                          <StreamCard
                            stream={{
                              ...stream,
                              creator: {
                                id: creator.id,
                                name: creator.displayName,
                                image: creator.avatarUrl,
                              },
                            }}
                            onJoinStream={handleJoinStream}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-700 rounded-3xl p-12 text-center bg-gray-800/50">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PlayCircle className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No streams yet</h3>
                    <p className="text-gray-400">Stay tuned for upcoming live shows!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImageIndex !== null && creator && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={handleClosePreview}
        >
          {/* Close Button */}
          <button
            onClick={handleClosePreview}
            className="absolute top-4 right-4 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-800/80 px-4 py-2 rounded-full text-white text-sm z-10">
            {selectedImageIndex + 1} / {creator.profileImages.length}
          </div>

          {/* Previous Button */}
          {creator.profileImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePreviousImage();
              }}
              className="absolute left-4 p-3 bg-gray-800/80 hover:bg-gray-700 rounded-full transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Next Button */}
          {creator.profileImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-4 p-3 bg-gray-800/80 hover:bg-gray-700 rounded-full transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creator.profileImages[selectedImageIndex]}
              alt={`${creator.displayName} photo ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Component for Bento Grid Attributes
function AttributeBox({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  if (!value || value === "None") return null;
  return (
    <div className="bg-gray-700/50 p-3 rounded-xl border border-gray-600/50 hover:bg-gray-700 transition-colors group">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="font-medium text-sm text-gray-200 truncate group-hover:text-white">
        {value}
      </div>
    </div>
  );
}