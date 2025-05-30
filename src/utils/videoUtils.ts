
export const getVideoThumbnail = (videoUrl: string): string => {
  if (!videoUrl) return '';

  // YouTube thumbnail extraction
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    let videoId = '';
    
    if (videoUrl.includes('youtube.com/watch?v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0];
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    }
    
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
  }

  // Vimeo thumbnail extraction
  if (videoUrl.includes('vimeo.com')) {
    const videoId = videoUrl.split('/').pop()?.split('?')[0];
    if (videoId) {
      // Note: Vimeo requires API call for thumbnails, so we'll return a placeholder
      return `https://vumbnail.com/${videoId}.jpg`;
    }
  }

  // For other video URLs, return a default video icon
  return '';
};

export const isValidVideoUrl = (url: string): boolean => {
  if (!url) return false;
  
  const videoPatterns = [
    /youtube\.com\/watch\?v=/,
    /youtu\.be\//,
    /vimeo\.com\//,
    /\.mp4$/,
    /\.webm$/,
    /\.ogg$/
  ];
  
  return videoPatterns.some(pattern => pattern.test(url));
};
