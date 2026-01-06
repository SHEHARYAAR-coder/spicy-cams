"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Image as ImageIcon, Video } from "lucide-react";

interface MediaGalleryUploadProps {
  images: string[];
  videos: string[];
  onUpdate: (images: string[], videos: string[]) => Promise<void>;
}

export default function MediaGalleryUpload({
  images,
  videos,
  onUpdate,
}: MediaGalleryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(`Uploading ${type}...`);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const response = await fetch("/api/profile/upload-media", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        uploadedUrls.push(data.url);
        setUploadProgress(
          `Uploaded ${i + 1} of ${files.length} ${type}(s)...`
        );
      }

      // Update the arrays
      if (type === "image") {
        await onUpdate([...images, ...uploadedUrls], videos);
      } else {
        await onUpdate(images, [...videos, ...uploadedUrls]);
      }

      setUploadProgress("Upload complete!");
      setTimeout(() => setUploadProgress(""), 2000);
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Failed to upload ${type}. Please try again.`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveMedia = async (url: string, type: "image" | "video") => {
    try {
      if (type === "image") {
        const newImages = images.filter((img) => img !== url);
        await onUpdate(newImages, videos);
      } else {
        const newVideos = videos.filter((vid) => vid !== url);
        await onUpdate(images, newVideos);
      }
    } catch (error) {
      console.error("Remove error:", error);
      alert(`Failed to remove ${type}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image Upload */}
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e, "image")}
            className="hidden"
            disabled={uploading}
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <ImageIcon className="w-12 h-12 text-gray-400" />
            <p className="text-sm text-gray-400">
              Click to upload images
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </label>
        </div>

        {/* Video Upload */}
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
          <input
            type="file"
            id="video-upload"
            accept="video/*"
            multiple
            onChange={(e) => handleFileUpload(e, "video")}
            className="hidden"
            disabled={uploading}
          />
          <label
            htmlFor="video-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Video className="w-12 h-12 text-gray-400" />
            <p className="text-sm text-gray-400">
              Click to upload videos
            </p>
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
            {images.map((url, index) => (
              <div key={index} className="relative group h-40">
                <Image
                  src={url}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  onClick={() => handleRemoveMedia(url, "image")}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
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
            {videos.map((url, index) => (
              <div key={index} className="relative group">
                <video
                  src={url}
                  className="w-full h-60 object-cover rounded-lg"
                  controls
                />
                <button
                  onClick={() => handleRemoveMedia(url, "video")}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && videos.length === 0 && !uploading && (
        <div className="text-center py-8 text-gray-500">
          No media uploaded yet. Upload images and videos to showcase on your profile.
        </div>
      )}
    </div>
  );
}
