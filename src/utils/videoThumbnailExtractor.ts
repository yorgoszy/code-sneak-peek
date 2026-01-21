/**
 * Extract a thumbnail frame from a video file using the browser's video element
 * and canvas API.
 */
export const extractThumbnailFromVideoFile = async (
  videoFile: File,
  seekToSeconds: number = 1
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(videoFile);
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    video.onloadedmetadata = () => {
      // Seek to the desired time (or middle of video if it's shorter)
      const seekTime = Math.min(seekToSeconds, video.duration / 2);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('❌ Could not get canvas context');
          cleanup();
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              console.log('✅ Thumbnail extracted:', blob.size, 'bytes');
              resolve(blob);
            } else {
              console.error('❌ Failed to create thumbnail blob');
              resolve(null);
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (error) {
        console.error('❌ Error extracting thumbnail:', error);
        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      console.error('❌ Error loading video for thumbnail extraction');
      cleanup();
      resolve(null);
    };

    // Timeout after 10 seconds
    setTimeout(() => {
      console.warn('⏰ Thumbnail extraction timeout');
      cleanup();
      resolve(null);
    }, 10000);
  });
};

/**
 * Upload a thumbnail blob to Supabase storage and return the public URL
 */
export const uploadThumbnailToStorage = async (
  supabase: any,
  thumbnailBlob: Blob,
  fileName: string
): Promise<string | null> => {
  try {
    const thumbnailFileName = `thumb_${Date.now()}_${fileName.replace(/\.[^/.]+$/, '')}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('course-thumbnails')
      .upload(thumbnailFileName, thumbnailBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Thumbnail upload error:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('course-thumbnails')
      .getPublicUrl(thumbnailFileName);

    console.log('✅ Thumbnail uploaded:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading thumbnail:', error);
    return null;
  }
};
