"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Heart,
  Camera,
  Calendar,
  Languages,
  User,
  Star,
  MessageCircle,
  Video,
  ArrowLeft,
  Play,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { StreamCard } from "@/components/stream";

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
    // TODO: Implement follow/unfollow functionality
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
    // TODO: Implement private messaging
    router.push(`/profile?message=${creatorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-gray-700 rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="aspect-square bg-gray-700 rounded-lg" />
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
                <div className="h-20 bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/m">
          <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Models
          </Button>
        </Link>

        {/* Profile Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                  {creator.avatarUrl ? (
                    <Image
                      src={creator.avatarUrl}
                      alt={creator.displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-32 h-32 text-gray-600" />
                    </div>
                  )}
                  {creator.category && (
                    <Badge className="absolute top-4 left-4 bg-purple-600/90 text-white">
                      {creator.category}
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-4 space-y-2">
                  <Button
                    className={`w-full ${
                      isFollowing
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                    onClick={handleFollowToggle}
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 ${isFollowing ? "fill-current" : ""}`}
                    />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="bg-gray-800/50 border-gray-700 mt-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {creator.followersCount}
                    </div>
                    <div className="text-xs text-gray-400">Followers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {creator.streamsCount}
                    </div>
                    <div className="text-xs text-gray-400">Streams</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                      {creator.displayName}
                    </CardTitle>
                    {creator.displayedCity && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{creator.displayedCity}</span>
                      </div>
                    )}
                  </div>
                  {creator.displayedAge && (
                    <Badge className="text-lg px-4 py-1 bg-gray-700">
                      {creator.displayedAge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bio */}
                {creator.bio && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                      About
                    </h3>
                    <p className="text-gray-300">{creator.bio}</p>
                  </div>
                )}

                {/* Profile Description */}
                {creator.profileDescription && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                      Description
                    </h3>
                    <p className="text-gray-300">{creator.profileDescription}</p>
                  </div>
                )}

                {/* Physical Attributes */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                    Physical Attributes
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {creator.ethnicity && (
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400">Ethnicity</div>
                        <div className="font-medium">{creator.ethnicity}</div>
                      </div>
                    )}
                    {creator.physique && (
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400">Physique</div>
                        <div className="font-medium">{creator.physique}</div>
                      </div>
                    )}
                    {creator.hairColor && (
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400">Hair Color</div>
                        <div className="font-medium">{creator.hairColor}</div>
                      </div>
                    )}
                    {creator.breastSize && (
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400">Breast Size</div>
                        <div className="font-medium">{creator.breastSize}</div>
                      </div>
                    )}
                    {creator.tattoos && (
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400">Tattoos</div>
                        <div className="font-medium">{creator.tattoos}</div>
                      </div>
                    )}
                    {creator.piercings && (
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400">Piercings</div>
                        <div className="font-medium">{creator.piercings}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Languages */}
                {creator.spokenLanguages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {creator.spokenLanguages.map((lang) => (
                        <Badge
                          key={lang}
                          className="bg-purple-600/20 text-purple-300 border border-purple-500/30"
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shows */}
                {creator.myShows.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                      My Shows
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {creator.myShows.map((show) => (
                        <Badge
                          key={show}
                          variant="outline"
                          className="border-gray-600 text-gray-300"
                        >
                          {show}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                  {creator.relationship && (
                    <div>
                      <div className="text-xs text-gray-400">Relationship</div>
                      <div className="font-medium">{creator.relationship}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-gray-400">Joined</div>
                    <div className="font-medium">
                      {new Date(creator.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Streams Section */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-400" />
              Streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creator.streams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {creator.streams.map((stream) => (
                  <StreamCard
                    key={stream.id}
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
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No streams available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
