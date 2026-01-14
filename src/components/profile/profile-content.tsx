"use client";

import { useSession } from "next-auth/react";
import { Edit2 } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import AvatarUpload from "@/components/ui/avatar-upload";
import CoverUpload from "@/components/ui/cover-upload";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ModelProfileEditDialog from "./model-profile-edit-dialog";
import MediaGalleryUpload from "./media-gallery-upload";

interface UserData {
  id: string;
  email?: string;
  emailVerified?: boolean;
  role?: string;
  status?: string;
  createdAt: string;
  lastLoginAt?: string;
  googleId?: string;
  appleId?: string;
  profile?: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
    category?: string;
    language?: string;
    isModel?: boolean;
    profileImages?: string[];
    profileVideos?: string[];
    // Model profile fields
    hairColor?: string;
    physique?: string;
    breastSize?: string;
    pubicHair?: string;
    displayedAge?: string | number;
    relationship?: string;
    ethnicity?: string;
    piercings?: string;
    tattoos?: string;
    displayedCity?: string;
    spokenLanguages?: string[];
    myShows?: string[];
  };
  wallet?: {
    balance: number;
  };
  _count?: {
    streams?: number;
  };
}

export default function ProfileContent() {
  const { data: session } = useSession();

  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [_roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [_roleLoading, setRoleLoading] = useState(false);
  const [_roleError, setRoleError] = useState<string | null>(null);

  // Memoize the fetch function to prevent recreation on every render
  const fetchProfile = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUserData(data);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize the user ID to prevent unnecessary effect triggers
  const userId = useMemo(() => session?.user?.id, [session?.user?.id]);

  // Function to manually refresh profile data
  const refreshProfile = useCallback(() => {
    if (userId) {
      setUserData(null); // Clear existing data to force refresh
      fetchProfile(userId);
    }
  }, [userId, fetchProfile]);

  React.useEffect(() => {
    if (userId && !userData) {
      fetchProfile(userId);
    }
  }, [userId, userData, fetchProfile]);

  // Refresh profile when component mounts or becomes visible (e.g., returning from upgrade page)
  React.useEffect(() => {
    if (userId) {
      refreshProfile();
    }
  }, [userId, refreshProfile]);

  // Handle avatar change
  const handleAvatarChange = useCallback(
    (newAvatarUrl: string | null) => {
      if (userData) {
        setUserData({
          ...userData,
          profile: {
            ...userData.profile,
            avatarUrl: newAvatarUrl ?? undefined,
          },
        });
      }
      setIsEditingAvatar(false);
    },
    [userData]
  );

  // Handle cover change
  const handleCoverChange = useCallback(
    (newCoverUrl: string | null) => {
      if (userData) {
        setUserData({
          ...userData,
          profile: {
            ...userData.profile,
            coverUrl: newCoverUrl ?? undefined,
          },
        });
      }
      setIsEditingCover(false);
    },
    [userData]
  );

  const _handleRoleChange = useCallback(async () => {
    if (!userData) return;

    setRoleLoading(true);
    setRoleError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: userData.profile?.displayName ?? null,
          bio: userData.profile?.bio ?? null,
          category: userData.profile?.category ?? null,
          language: userData.profile?.language ?? null,
          isModel: true,
          targetRole: "MODEL",
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "Failed to change role");
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
      setRoleDialogOpen(false);
    } catch (error) {
      console.error("Error changing role:", error);
      setRoleError(
        error instanceof Error ? error.message : "Unable to change role"
      );
    } finally {
      setRoleLoading(false);
    }
  }, [userData]);

  // Memoize profile sections to prevent unnecessary re-renders
  const profileCard = useMemo(() => {
    if (!userData) return null;

    return (
      <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden mb-6">
        {/* Cover Photo Section */}
        <div className="relative">
          {isEditingCover ? (
            <div className="p-4">
              <CoverUpload
                currentCoverUrl={userData.profile?.coverUrl}
                onCoverChange={handleCoverChange}
              />
            </div>
          ) : (
            <div className="relative group">
              {/* Cover Photo */}
              <div className="w-full h-48 md:h-64 bg-gradient-to-br from-purple-900/50 to-purple-700/50 overflow-hidden">
                {userData.profile?.coverUrl ? (
                  <img
                    src={userData.profile.coverUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-400 text-sm">No cover photo</p>
                  </div>
                )}
              </div>

              {/* Edit Cover Button Overlay */}
              <button
                onClick={() => setIsEditingCover(true)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 opacity-0 group-hover:opacity-100"
                title="Change cover photo"
              >
                <Edit2 className="w-4 h-4" />
                Edit Cover
              </button>
            </div>
          )}

          {/* Profile Picture - Positioned to overlap cover */}
          <div className="absolute -bottom-12 left-8">
            <div className="relative">
              {isEditingAvatar ? (
                <AvatarUpload
                  currentAvatarUrl={userData.profile?.avatarUrl}
                  displayName={userData.profile?.displayName}
                  email={userData.email}
                  size="xl"
                  onAvatarChange={handleAvatarChange}
                  className="items-center"
                />
              ) : (
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-3xl font-semibold overflow-hidden border-4 border-gray-800">
                    {userData.profile?.avatarUrl ? (
                      <img
                        src={userData.profile.avatarUrl}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      `${userData.profile?.displayName?.[0] ||
                      userData.email?.[0] ||
                      "U"
                      }`
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-800"></div>

                  {/* Edit avatar button */}
                  <button
                    onClick={() => setIsEditingAvatar(true)}
                    className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Change avatar"
                  >
                    <Edit2 className="w-6 h-6 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="pt-16 px-8 pb-8">
          {!isEditingAvatar && !isEditingCover && (
            <div className="flex-1">
              <div className="flex justify-between items-center gap-3">
                <div className="flex justify-center items-center gap-3">
                  <h2 className="text-2xl font-semibold text-white">
                    {userData.profile?.displayName || userData.email}
                  </h2>
                  —
                  <p className="text-gray-400 capitalize">
                    {userData.role?.toLowerCase()}
                  </p>
                  <button
                    onClick={() => setIsEditingAvatar(true)}
                    className="text-gray-400 hover:text-purple-300 transition-colors"
                    title="Edit avatar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {/* {userData?.role !== "MODEL" && (
                    <Link href={"/upgrade"}>
                      <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold cursor-pointer">
                        <Crown className="w-4 h-4" />
                        Upgrade to Model
                      </button>
                    </Link>
                  )} */}
                </div>
              </div>
              {userData.profile?.bio && (
                <div className="py-2 italic">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    &ldquo;{userData.profile.bio}&rdquo;
                  </p>
                </div>
              )}
              <p className="text-gray-400 text-sm">
                Status:{" "}
                <span className="capitalize">
                  {userData.status?.toLowerCase()}
                </span>
              </p>
            </div>
          )}

          {(isEditingAvatar || isEditingCover) && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => {
                  setIsEditingAvatar(false);
                  setIsEditingCover(false);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userData,
    isEditingAvatar,
    isEditingCover,
    handleAvatarChange,
    handleCoverChange,
  ]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [creatorEditDialogOpen, setCreatorEditDialogOpen] = useState(false);

  const handleEditOpen = () => {
    setEditDisplayName(userData?.profile?.displayName || "");
    setEditBio(userData?.profile?.bio || "");
    setEditEmail(userData?.email || "");
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editDisplayName,
          bio: editBio,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setUserData(updated);
      setEditDialogOpen(false);
    } catch (_err) {
      alert("Failed to update profile");
    }
    setEditLoading(false);
  };

  interface ModelProfileData {
    hairColor?: string | null;
    physique?: string | null;
    breastSize?: string | null;
    pubicHair?: string | null;
    displayedAge?: string | number | null;
    spokenLanguages?: string[];
    relationship?: string | null;
    ethnicity?: string | null;
    piercings?: string | null;
    tattoos?: string | null;
    displayedCity?: string | null;
    myShows?: string[];
    profileDescription?: string | null;
  }

  const handleModelProfileSave = async (modelData: ModelProfileData) => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: userData?.profile?.displayName,
        bio: userData?.profile?.bio,
        category: userData?.profile?.category,
        language: userData?.profile?.language,
        isModel: userData?.profile?.isModel,
        ...modelData,
      }),
    });
    if (!res.ok) throw new Error("Failed to update model profile");
    const updated = await res.json();
    setUserData(updated);
  };

  const handleMediaUpdate = useCallback(async (images: string[], videos: string[]) => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: userData?.profile?.displayName,
        bio: userData?.profile?.bio,
        category: userData?.profile?.category,
        language: userData?.profile?.language,
        isModel: userData?.profile?.isModel,
        profileImages: images,
        profileVideos: videos,
      }),
    });
    if (!res.ok) throw new Error("Failed to update media gallery");
    const updated = await res.json();
    setUserData(updated);
  }, [userData]);

  const personalInfo = useMemo(() => {
    if (!userData) return null;
    return (
      <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            Personal Information
          </h3>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                onClick={handleEditOpen}
              >
                <Edit2 size={16} />
                Edit
              </button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border border-purple-700 rounded-xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Edit Personal Information
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Display Name
                  </label>
                  <Input
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Bio
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2 w-full min-h-[80px]"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editBio.length}/200
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Email
                  </label>
                  <Input
                    value={editEmail}
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Role
                  </label>
                  <Input
                    value={userData?.role?.toLowerCase() || ""}
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed capitalize"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Status
                  </label>
                  <Input
                    value={userData?.status?.toLowerCase() || ""}
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed capitalize"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6 flex gap-2 justify-end">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleEditSave}
                  disabled={editLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Display Name
            </label>
            <p className="text-gray-200 font-medium">
              {userData.profile?.displayName || "Not set"}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Email Address
            </label>
            <p className="text-gray-200 font-medium">{userData.email}</p>
            {userData.emailVerified && (
              <span className="text-green-600 text-xs">✓ Verified</span>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              User Role
            </label>
            <p className="text-gray-200 font-medium capitalize">
              {userData.role?.toLowerCase()}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Account Status
            </label>
            <p className="text-gray-200 font-medium capitalize">
              {userData.status?.toLowerCase()}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Member Since
            </label>
            <p className="text-gray-200 font-medium">
              {new Date(userData.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Last Login
            </label>
            <p className="text-gray-200 font-medium">
              {userData.lastLoginAt
                ? new Date(userData.lastLoginAt).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userData,
    editDialogOpen,
    editDisplayName,
    editBio,
    editEmail,
    editLoading,
  ]);

  const creatorInfo = useMemo(() => {
    if (!userData?.profile?.isModel) return null;

    return (
      <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            Model Information
          </h3>
          <button
            onClick={() => setCreatorEditDialogOpen(true)}
            className="flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 rounded-lg border border-gray-600 hover:border-purple-500/50 hover:bg-purple-500/10 transition-colors">
            <Edit2 size={16} />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Category</label>
            <p className="text-gray-200 font-medium">
              {userData.profile.category || "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Language</label>
            <p className="text-gray-200 font-medium">
              {userData.profile.language || "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Total Streams
            </label>
            <p className="text-gray-200 font-medium">
              {userData._count?.streams || 0}
            </p>
          </div>

          {/* New Model Fields */}
          {userData.profile.hairColor && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Hair Color</label>
              <p className="text-gray-200 font-medium">{userData.profile.hairColor}</p>
            </div>
          )}

          {userData.profile.physique && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Physique</label>
              <p className="text-gray-200 font-medium">{userData.profile.physique}</p>
            </div>
          )}

          {userData.profile.breastSize && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Breast Size</label>
              <p className="text-gray-200 font-medium">{userData.profile.breastSize}</p>
            </div>
          )}

          {userData.profile.pubicHair && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Pubic Hair</label>
              <p className="text-gray-200 font-medium">{userData.profile.pubicHair}</p>
            </div>
          )}

          {userData.profile.displayedAge && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Age</label>
              <p className="text-gray-200 font-medium">{userData.profile.displayedAge}</p>
            </div>
          )}

          {userData.profile.relationship && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Relationship</label>
              <p className="text-gray-200 font-medium">{userData.profile.relationship}</p>
            </div>
          )}

          {userData.profile.ethnicity && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Ethnicity</label>
              <p className="text-gray-200 font-medium">{userData.profile.ethnicity}</p>
            </div>
          )}

          {userData.profile.piercings && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Piercings</label>
              <p className="text-gray-200 font-medium">{userData.profile.piercings}</p>
            </div>
          )}

          {userData.profile.tattoos && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Tattoos</label>
              <p className="text-gray-200 font-medium">{userData.profile.tattoos}</p>
            </div>
          )}

          {userData.profile.displayedCity && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">City</label>
              <p className="text-gray-200 font-medium">{userData.profile.displayedCity}</p>
            </div>
          )}
        </div>

        {/* Spoken Languages */}
        {userData.profile.spokenLanguages && userData.profile.spokenLanguages.length > 0 && (
          <div className="mt-6">
            <label className="text-sm text-gray-400 mb-2 block">Spoken Languages</label>
            <div className="flex flex-wrap gap-2">
              {userData.profile.spokenLanguages.map((lang: string) => (
                <span key={lang} className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* My Shows */}
        {userData.profile.myShows && userData.profile.myShows.length > 0 && (
          <div className="mt-6">
            <label className="text-sm text-gray-400 mb-2 block">My Shows</label>
            <div className="flex flex-wrap gap-2">
              {userData.profile.myShows.map((show: string) => (
                <span key={show} className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                  {show}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Profile Description */}
        {/* {userData.profile.profileDescription && (
          <div className="mt-6">
            <label className="text-sm text-gray-400 mb-2 block">About Me</label>
            <p className="text-gray-300 leading-relaxed bg-gray-900/50 p-4 rounded-lg">
              {userData.profile.profileDescription}
            </p>
          </div>
        )} */}
      </div>
    );
  }, [userData]);

  const mediaGallery = useMemo(() => {
    if (!userData?.profile?.isModel) return null;

    return (
      <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8 mb-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">Media Gallery</h3>
          <p className="text-sm text-gray-400">Upload images and videos to showcase on your public profile</p>
        </div>
        <MediaGalleryUpload
          images={userData.profile.profileImages || []}
          videos={userData.profile.profileVideos || []}
          onUpdate={handleMediaUpdate}
        />
      </div>
    );
  }, [userData, handleMediaUpdate]);

  const walletActivity = useMemo(() => {
    if (!userData) return null;

    return (
      <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            Wallet & Activity
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Wallet Balance
            </label>
            <p className="text-gray-200 font-medium text-lg">
              {userData.wallet
                ? `${userData.wallet.balance} Tokens`
                : "No wallet"}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Want More Tokens
            </label>
            <p className="text-gray-200 font-medium underline">
              <Link href={`/pricing`}>buy</Link>
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Payment History
            </label>
            <p className="text-gray-200 font-medium underline">
              <Link href={`/profile/${userData.id}/payments`}>view all</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }, [userData]);

  const accountSettings = useMemo(() => {
    if (!userData) return null;

    return (
      <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Account Settings</h3>
          <button className="flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 rounded-lg border border-gray-600 hover:border-purple-500/50 hover:bg-purple-500/10 transition-colors">
            <Edit2 size={16} />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Account ID
            </label>
            <p className="text-gray-200 font-mono text-sm">{userData.id}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Authentication Method
            </label>
            <p className="text-gray-200 font-medium">
              {userData.googleId
                ? "Google OAuth"
                : userData.appleId
                  ? "Apple OAuth"
                  : "Email & Password"}
            </p>
          </div>
        </div>
      </div>
    );
  }, [userData]);

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-white">Profile</h1>
      {loading ? (
        <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-400">Loading profile...</p>
        </div>
      ) : userData ? (
        <>
          {profileCard}
          {personalInfo}
          {creatorInfo}
          {mediaGallery}
          {userData?.role !== 'MODEL' && walletActivity}
          {accountSettings}

          {/* Model Profile Edit Dialog */}
          {userData?.profile?.isModel && (
            <ModelProfileEditDialog
              open={creatorEditDialogOpen}
              onOpenChange={setCreatorEditDialogOpen}
              profileData={userData.profile}
              onSave={handleModelProfileSave}
            />
          )}
        </>
      ) : (
        <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-400">Failed to load profile.</p>
        </div>
      )}
    </>
  );
}
