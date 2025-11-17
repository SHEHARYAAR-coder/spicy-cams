"use client";

import React, { useRef, useState } from "react";
import { Camera, Trash2, Upload, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  displayName?: string;
  email?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onAvatarChange?: (avatarUrl: string | null) => void;
  disabled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-40 h-40",
};

const iconSizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-7 h-7",
};

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  displayName,
  email,
  size = "lg",
  onAvatarChange,
  disabled = false,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const avatarUrl = previewUrl || currentAvatarUrl;
  const fallbackText = displayName?.[0] || email?.[0] || "U";

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File size too large. Maximum size is 5MB.");
      return;
    }

    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload avatar");
      }

      // Update the preview to the actual URL
      setPreviewUrl(null);
      onAvatarChange?.(data.avatarUrl);
    } catch (err) {
      console.error("Avatar upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAvatar = async () => {
    if (!currentAvatarUrl) return;

    setIsUploading(true);
    setError("");

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove avatar");
      }

      onAvatarChange?.(null);
    } catch (err) {
      console.error("Avatar removal error:", err);
      setError(err instanceof Error ? err.message : "Failed to remove avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* Avatar Display */}
      <div className="relative group">
        <Avatar
          className={cn(sizeClasses[size], "cursor-pointer transition-all")}
        >
          <AvatarImage
            src={avatarUrl}
            alt="Profile avatar"
            className="object-cover"
          />
          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-orange-400 to-yellow-500 text-white">
            {isUploading ? (
              <div className="animate-spin">
                <Upload className={iconSizeClasses[size]} />
              </div>
            ) : (
              fallbackText
            )}
          </AvatarFallback>
        </Avatar>

        {/* Overlay for hover effect */}
        {!disabled && !isUploading && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={triggerFileSelect}
          >
            <Camera className={cn(iconSizeClasses[size], "text-white")} />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={disabled || isUploading}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? "Uploading..." : "Upload Photo"}
        </button>

        {currentAvatarUrl && !disabled && !isUploading && (
          <button
            type="button"
            onClick={removeAvatar}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm text-center max-w-xs">{error}</p>
      )}

      {/* Upload instructions */}
      {!error && (
        <p className="text-gray-500 text-xs text-center max-w-xs">
          Supported formats: JPEG, PNG, WebP, GIF. Max size: 5MB.
        </p>
      )}
    </div>
  );
};

export default AvatarUpload;
