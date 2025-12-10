"use client";

import React, { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoverUploadProps {
    currentCoverUrl?: string | null;
    onCoverChange?: (newCoverUrl: string | null) => void;
    disabled?: boolean;
    className?: string;
}

export const CoverUpload: React.FC<CoverUploadProps> = ({
    currentCoverUrl,
    onCoverChange,
    disabled = false,
    className,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string>("");

    const coverUrl = previewUrl || currentCoverUrl;

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            setError("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.");
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError("File size exceeds 10MB limit");
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
            setError("");
        };
        reader.readAsDataURL(file);

        // Upload file
        uploadCover(file);
    };

    const uploadCover = async (file: File) => {
        setIsUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("cover", file);

            const response = await fetch("/api/profile/cover", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to upload cover");
            }

            const data = await response.json();
            setPreviewUrl(null);
            onCoverChange?.(data.coverUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload cover");
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
        }
    };

    const removeCover = async () => {
        setIsUploading(true);
        setError("");

        try {
            const response = await fetch("/api/profile/cover", {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to remove cover");
            }

            setPreviewUrl(null);
            onCoverChange?.(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to remove cover");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={cn("relative w-full", className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isUploading}
            />

            <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-purple-900/50 to-purple-700/50 rounded-lg overflow-hidden group">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Camera className="w-12 h-12 mb-2" />
                        <p className="text-sm">No cover photo</p>
                        <p className="text-xs text-gray-500 mt-1">Recommended: 1200x400px</p>
                    </div>
                )}

                {/* Overlay with buttons */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isUploading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                {coverUrl ? "Change Cover" : "Upload Cover"}
                            </>
                        )}
                    </button>

                    {coverUrl && !isUploading && (
                        <button
                            onClick={removeCover}
                            disabled={disabled}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="w-4 h-4" />
                            Remove
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
        </div>
    );
};

export default CoverUpload;
