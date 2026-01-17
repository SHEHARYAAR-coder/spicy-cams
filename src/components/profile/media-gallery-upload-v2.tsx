"use client";

import { useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Video, Lock, Unlock, Eye, EyeOff, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface MediaItem {
    id: string;
    url: string;
    type: "IMAGE" | "VIDEO";
    isPublic: boolean;
    tokenCost: number;
    fileName?: string;
    sortOrder: number;
}

interface MediaGalleryUploadV2Props {
    profileId?: string;
    userId?: string;
}

export default function MediaGalleryUploadV2({ profileId, userId }: MediaGalleryUploadV2Props) {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");

    // Upload settings
    const [uploadAsPublic, setUploadAsPublic] = useState(true);
    const [defaultTokenCost, setDefaultTokenCost] = useState(10);

    // Edit dialog
    const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
    const [editIsPublic, setEditIsPublic] = useState(true);
    const [editTokenCost, setEditTokenCost] = useState(10);

    useEffect(() => {
        fetchMedia();
    }, [profileId, userId]);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (profileId) params.append("profileId", profileId);
            if (userId) params.append("userId", userId);

            const response = await fetch(`/api/profile/media?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setMedia(data.media || []);
                setIsOwner(data.isOwner || false);
            } else {
                console.error("Failed to fetch media:", response.status);
                // If fetch fails, still set isOwner to true if userId is provided
                // (assumes we're on our own profile page)
                setIsOwner(!!userId);
            }
        } catch (error) {
            console.error("Error fetching media:", error);
            // On error, assume owner if userId is provided
            setIsOwner(!!userId);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "image" | "video"
    ) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadProgress(`Uploading ${type}...`);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append("file", file);
                formData.append("type", type);
                formData.append("isPublic", uploadAsPublic.toString());
                formData.append("tokenCost", defaultTokenCost.toString());

                const response = await fetch("/api/profile/upload-media", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }

                setUploadProgress(
                    `Uploaded ${i + 1} of ${files.length} ${type}(s)...`
                );
            }

            setUploadProgress("Upload complete!");
            setTimeout(() => setUploadProgress(""), 2000);

            // Refresh media list
            await fetchMedia();
        } catch (error) {
            console.error("Upload error:", error);
            alert(`Failed to upload ${type}. Please try again.`);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleRemoveMedia = async (mediaId: string) => {
        if (!confirm("Are you sure you want to delete this media?")) return;

        try {
            const response = await fetch(`/api/profile/media?mediaId=${mediaId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                await fetchMedia();
            } else {
                throw new Error("Failed to delete media");
            }
        } catch (error) {
            console.error("Remove error:", error);
            alert("Failed to remove media");
        }
    };

    const openEditDialog = (item: MediaItem) => {
        setEditingMedia(item);
        setEditIsPublic(item.isPublic);
        setEditTokenCost(item.tokenCost);
    };

    const handleUpdateMediaSettings = async () => {
        if (!editingMedia) return;

        try {
            const response = await fetch("/api/profile/media", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mediaId: editingMedia.id,
                    isPublic: editIsPublic,
                    tokenCost: editTokenCost,
                }),
            });

            if (response.ok) {
                await fetchMedia();
                setEditingMedia(null);
            } else {
                throw new Error("Failed to update media");
            }
        } catch (error) {
            console.error("Update error:", error);
            alert("Failed to update media settings");
        }
    };

    const images = media.filter((m) => m.type === "IMAGE");
    const videos = media.filter((m) => m.type === "VIDEO");

    if (!isOwner && !loading) {
        return <div className="text-gray-400 text-center py-4">Only model owners can manage media</div>;
    }

    if (loading) {
        return <div className="text-gray-400 text-center py-4">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Upload Settings */}
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Upload Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setUploadAsPublic(!uploadAsPublic)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${uploadAsPublic
                                ? "bg-green-600/20 text-green-400 border border-green-600/50"
                                : "bg-purple-600/20 text-purple-400 border border-purple-600/50"
                                }`}
                        >
                            {uploadAsPublic ? (
                                <>
                                    <Unlock className="w-4 h-4" />
                                    Upload as Public
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    Upload as Private
                                </>
                            )}
                        </button>
                    </div>
                    {!uploadAsPublic && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-400">Token Cost:</label>
                            <Input
                                type="number"
                                min="1"
                                value={defaultTokenCost}
                                onChange={(e) => setDefaultTokenCost(parseInt(e.target.value) || 10)}
                                className="w-24 bg-gray-800 border-gray-700"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Upload */}
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
                    <input
                        type="file"
                        id="image-upload-v2"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, "image")}
                        className="hidden"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="image-upload-v2"
                        className="cursor-pointer flex flex-col items-center gap-2"
                    >
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                        <p className="text-sm text-gray-400">Click to upload images</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </label>
                </div>

                {/* Video Upload */}
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
                    <input
                        type="file"
                        id="video-upload-v2"
                        accept="video/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, "video")}
                        className="hidden"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="video-upload-v2"
                        className="cursor-pointer flex flex-col items-center gap-2"
                    >
                        <Video className="w-12 h-12 text-gray-400" />
                        <p className="text-sm text-gray-400">Click to upload videos</p>
                        <p className="text-xs text-gray-500">MP4, WebM up to 50MB</p>
                    </label>
                </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress && (
                <div className="text-center text-sm text-purple-400">
                    {uploadProgress}
                </div>
            )}

            {/* Images Gallery */}
            {images.length > 0 && (
                <div>
                    <h4 className="text-lg font-semibold text-white mb-3">
                        Images ({images.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((item) => (
                            <div key={item.id} className="relative group">
                                <img
                                    src={item.url}
                                    alt={item.fileName || "Gallery image"}
                                    className="w-full h-40 object-cover rounded-lg"
                                />
                                <div className="absolute top-2 left-2">
                                    {item.isPublic ? (
                                        <div className="bg-green-600/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            Public
                                        </div>
                                    ) : (
                                        <div className="bg-purple-600/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            {item.tokenCost} tokens
                                        </div>
                                    )}
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                        onClick={() => openEditDialog(item)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full"
                                        title="Edit settings"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleRemoveMedia(item.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                                        title="Remove image"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Videos Gallery */}
            {videos.length > 0 && (
                <div>
                    <h4 className="text-lg font-semibold text-white mb-3">
                        Videos ({videos.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videos.map((item) => (
                            <div key={item.id} className="relative group">
                                <video
                                    src={item.url}
                                    className="w-full h-60 object-cover rounded-lg"
                                    controls
                                    preload="metadata"
                                />
                                <div className="absolute top-2 left-2">
                                    {item.isPublic ? (
                                        <div className="bg-green-600/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            Public
                                        </div>
                                    ) : (
                                        <div className="bg-purple-600/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            {item.tokenCost} tokens
                                        </div>
                                    )}
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                        onClick={() => openEditDialog(item)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full"
                                        title="Edit settings"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleRemoveMedia(item.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                                        title="Remove video"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {media.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                    No media uploaded yet. Upload images and videos to showcase on your profile.
                </div>
            )}

            {/* Edit Media Dialog */}
            <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Edit Media Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Visibility</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditIsPublic(true)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${editIsPublic
                                        ? "bg-green-600/20 text-green-400 border-2 border-green-600"
                                        : "bg-gray-800 text-gray-400 border-2 border-gray-700"
                                        }`}
                                >
                                    <Eye className="w-4 h-4" />
                                    Public
                                </button>
                                <button
                                    onClick={() => setEditIsPublic(false)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${!editIsPublic
                                        ? "bg-purple-600/20 text-purple-400 border-2 border-purple-600"
                                        : "bg-gray-800 text-gray-400 border-2 border-gray-700"
                                        }`}
                                >
                                    <Lock className="w-4 h-4" />
                                    Private
                                </button>
                            </div>
                        </div>
                        {!editIsPublic && (
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">
                                    Token Cost to Unlock
                                </label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={editTokenCost}
                                    onChange={(e) => setEditTokenCost(parseInt(e.target.value) || 10)}
                                    className="bg-gray-800 border-gray-700"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Users will pay this amount in tokens to view this private content
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingMedia(null)}
                            className="border-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateMediaSettings}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
