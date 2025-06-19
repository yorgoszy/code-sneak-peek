
export const getVideoThumbnail = (videoUrl: string): string => {
  if (!videoUrl || videoUrl === 'undefined' || videoUrl === 'null') {
    console.log('❌ getVideoThumbnail: Empty or undefined URL');
    return '';
  }

  console.log('🎥 getVideoThumbnail processing URL:', videoUrl);

  // YouTube thumbnail extraction
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    let videoId = '';
    
    if (videoUrl.includes('youtube.com/watch?v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0];
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    } else if (videoUrl.includes('/embed/')) {
      videoId = videoUrl.split('/embed/')[1]?.split('?')[0];
    }
    
    if (videoId) {
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      console.log('🎬 YouTube thumbnail generated:', thumbnailUrl);
      return thumbnailUrl;
    }
  }

  // Vimeo thumbnail extraction
  if (videoUrl.includes('vimeo.com')) {
    const videoId = videoUrl.split('/').pop()?.split('?')[0];
    if (videoId) {
      const thumbnailUrl = `https://vumbnail.com/${videoId}.jpg`;
      console.log('🎬 Vimeo thumbnail generated:', thumbnailUrl);
      return thumbnailUrl;
    }
  }

  // For other video URLs, return empty (will show play icon)
  console.log('❌ No thumbnail available for URL:', videoUrl);
  return '';
};

export const isValidVideoUrl = (url: string | any): boolean => {
  if (!url) {
    console.log('❌ isValidVideoUrl: No URL provided');
    return false;
  }
  
  // ΔΙΟΡΘΩΣΗ: Καλύτερος χειρισμός διαφορετικών formats
  let processedUrl = url;
  
  // Αν είναι object, προσπάθησε να πάρεις το value
  if (typeof url === 'object' && url !== null) {
    if (url.value && url.value !== 'undefined' && url.value !== 'null') {
      processedUrl = url.value;
    } else {
      console.log('❌ isValidVideoUrl: Object has undefined or empty value:', url);
      return false;
    }
  }
  
  // Αν είναι string αλλά έχει την τιμή "undefined" ή "null"
  if (processedUrl === 'undefined' || processedUrl === 'null' || typeof processedUrl !== 'string') {
    console.log('❌ isValidVideoUrl: Invalid URL type or "undefined/null" string:', typeof processedUrl, processedUrl);
    return false;
  }
  
  // Trim whitespace
  processedUrl = processedUrl.trim();
  
  console.log('🔍 isValidVideoUrl checking processed URL:', processedUrl);
  
  const videoPatterns = [
    /youtube\.com\/watch\?v=/,
    /youtu\.be\//,
    /youtube\.com\/embed\//,
    /vimeo\.com\//,
    /\.mp4$/i,
    /\.webm$/i,
    /\.ogg$/i
  ];
  
  const isValid = videoPatterns.some(pattern => pattern.test(processedUrl));
  console.log('🔍 isValidVideoUrl result:', isValid, 'for URL:', processedUrl);
  
  return isValid;
};
