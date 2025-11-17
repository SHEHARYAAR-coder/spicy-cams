"use client";
import { useSession } from "next-auth/react";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Edit2,
  ChevronLeft,
  Crown,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import AvatarUpload from "@/components/ui/avatar-upload";
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

const ProfilePage = () => {
  const { data: session } = useSession();

  const [userData, setUserData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

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

  React.useEffect(() => {
    if (userId && !userData) {
      fetchProfile(userId);
    }
  }, [userId, userData, fetchProfile]);

  // Function to manually refresh profile data
  const refreshProfile = useCallback(() => {
    if (userId) {
      setUserData(null); // Clear existing data to force refresh
      fetchProfile(userId);
    }
  }, [userId, fetchProfile]);

  // Handle avatar change
  const handleAvatarChange = useCallback(
    (newAvatarUrl: string | null) => {
      if (userData) {
        setUserData({
          ...userData,
          profile: {
            ...userData.profile,
            avatarUrl: newAvatarUrl,
          },
        });
      }
      setIsEditingAvatar(false);
    },
    [userData]
  );

  // Memoize profile sections to prevent unnecessary re-renders
  const profileCard = useMemo(() => {
    if (!userData) return null;

    return (
      <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8 mb-6">
        <div className="flex items-center gap-6">
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
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-3xl font-semibold overflow-hidden">
                  {userData.profile?.avatarUrl ? (
                    <img
                      src={userData.profile.avatarUrl}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    `${
                      userData.profile?.displayName?.[0] ||
                      userData.email?.[0] ||
                      "U"
                    }`
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>

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

          {!isEditingAvatar && (
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
                {session?.user && (session.user as any).role !== "CREATOR" && (
                  <div>
                    <Link href={"/upgrade"}>
                      <button className="px-4 py-2 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold cursor-pointer">
                        <Crown className="w-4 h-4" />
                        Upgrade to Pro
                      </button>
                    </Link>
                  </div>
                )}
              </div>
              {userData.profile?.bio && (
                <div className="py-2 italic">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    "{userData.profile.bio}"
                  </p>
                </div>
              )}
              {userData.profile?.isCreator && (
                <span className="inline-block bg-purple-100/10 text-purple-300 text-xs px-2 py-1 rounded-full mt-1">
                  Content Creator
                </span>
              )}
              <p className="text-gray-400 text-sm">
                Status:{" "}
                <span className="capitalize">
                  {userData.status?.toLowerCase()}
                </span>
              </p>
            </div>
          )}
        </div>

        {isEditingAvatar && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setIsEditingAvatar(false)}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }, [userData, isEditingAvatar, handleAvatarChange]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);

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
    } catch (err) {
      alert("Failed to update profile");
    }
    setEditLoading(false);
  };

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
  }, [
    userData,
    editDialogOpen,
    editDisplayName,
    editBio,
    editEmail,
    editLoading,
  ]);

  const creatorInfo = useMemo(() => {
    if (!userData?.profile?.isCreator) return null;

    return (
      <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            Creator Information
          </h3>
          <button className="flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 rounded-lg border border-gray-600 hover:border-purple-500/50 hover:bg-purple-500/10 transition-colors">
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
        </div>
      </div>
    );
  }, [userData]);

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
                : // ? `${userData.wallet.balance} ${userData.wallet.currency}`
                  "No wallet"}
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
      <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto py-8">
        <div className="flex justify-start items-center mb-3">
          <Link href={"/"}>
            <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 active:bg-purple-500/20 transition-all cursor-pointer">
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[17px] font-normal">Back</span>
            </button>
          </Link>
        </div>
        {loading ? (
          <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-400">Loading profile...</p>
          </div>
        ) : userData ? (
          <>
            {profileCard}
            {personalInfo}
            {creatorInfo}
            {walletActivity}
            {accountSettings}
          </>
        ) : (
          <div className="bg-gray-800/50 border-gray-700 backdrop-blur-sm rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-400">Failed to load profile.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
