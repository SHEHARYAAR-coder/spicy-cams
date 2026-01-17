"use client";

/**
 * Utility to capture video thumbnail from live stream
 */

export interface CaptureOptions {
  quality?: number; // 0-1, default 0.95
  maxWidth?: number; // default 1280
  maxHeight?: number; // default 720
  format?: 'image/jpeg' | 'image/png' | 'image/webp'; // default 'image/jpeg'
}

/**
 * Capture thumbnail from a video element
 */
export function captureVideoThumbnail(
  videoElement: HTMLVideoElement,
  options: CaptureOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const {
        quality = 0.95,
        maxWidth = 1280,
        maxHeight = 720,
        format = 'image/jpeg'
      } = options;

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate dimensions maintaining aspect ratio
      let width = videoElement.videoWidth;
      let height = videoElement.videoHeight;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw video frame to canvas
      ctx.drawImage(videoElement, 0, 0, width, height);

      // Convert to data URL
      const dataUrl = canvas.toDataURL(format, quality);
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Upload thumbnail to server
 */
export async function uploadThumbnail(
  dataUrl: string,
  streamId: string
): Promise<string> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create form data
    const formData = new FormData();
    formData.append('thumbnail', blob, `stream-${streamId}-thumbnail.jpg`);
    formData.append('streamId', streamId);

    // Upload to server
    const uploadResponse = await fetch('/api/streams/thumbnail/upload', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload thumbnail');
    }

    const data = await uploadResponse.json();
    return data.thumbnailUrl;
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    throw error;
  }
}

/**
 * Auto-capture thumbnail from video after it starts playing
 */
export function setupAutoThumbnailCapture(
  videoElement: HTMLVideoElement,
  streamId: string,
  onThumbnailCaptured?: (thumbnailUrl: string) => void
): () => void {
  let captured = false;
  let timeoutId: NodeJS.Timeout;

  const captureHandler = async () => {
    if (captured) return;

    try {
      // Wait a bit for video to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if video is actually playing
      if (videoElement.paused || videoElement.ended) {
        return;
      }

      captured = true;

      // Capture thumbnail
      const dataUrl = await captureVideoThumbnail(videoElement, {
        quality: 0.9,
        maxWidth: 1280,
        maxHeight: 720,
      });

      // Upload thumbnail
      const thumbnailUrl = await uploadThumbnail(dataUrl, streamId);

      console.log('✅ Auto-captured stream thumbnail:', thumbnailUrl);

      // Notify callback
      onThumbnailCaptured?.(thumbnailUrl);
    } catch (error) {
      console.error('Failed to auto-capture thumbnail:', error);
    }
  };

  // Try to capture after video starts playing
  const playHandler = () => {
    timeoutId = setTimeout(captureHandler, 3000);
  };

  videoElement.addEventListener('play', playHandler);

  // Cleanup function
  return () => {
    videoElement.removeEventListener('play', playHandler);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}
