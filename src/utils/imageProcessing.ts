/**
 * Image processing utilities for avatar uploads
 * Handles resizing, cropping, and compression without distortion
 */

const MAX_AVATAR_SIZE = 400; // Maximum dimension for avatars
const JPEG_QUALITY = 0.85; // Initial quality for JPEG compression
const MAX_AVATAR_BYTES = 300 * 1024; // Target max file size for avatars (~300KB)
const MIN_QUALITY = 0.5; // Don't go below this quality

interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Loads an image from a File object
 */
export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Αποτυχία φόρτωσης εικόνας'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Processes an avatar image:
 * - Crops to square (center crop) to avoid distortion
 * - Resizes to max dimensions
 * - Compresses for optimal file size
 */
export const processAvatarImage = async (file: File): Promise<ProcessedImage> => {
  const img = await loadImageFromFile(file);
  
  // Calculate square crop dimensions (center crop)
  const size = Math.min(img.naturalWidth, img.naturalHeight);
  const cropX = (img.naturalWidth - size) / 2;
  const cropY = (img.naturalHeight - size) / 2;
  
  // Calculate output size
  const outputSize = Math.min(size, MAX_AVATAR_SIZE);
  
  // Create canvas for processing
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Αποτυχία δημιουργίας canvas context');
  }
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw cropped and resized image
  ctx.drawImage(
    img,
    cropX, cropY, size, size, // Source: center square crop
    0, 0, outputSize, outputSize // Destination: full canvas
  );
  
  // Clean up object URL
  URL.revokeObjectURL(img.src);
  
  // Iteratively compress until under target size (handles very large source images)
  const toBlob = (quality: number): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality));

  let quality = JPEG_QUALITY;
  let blob = await toBlob(quality);

  while (blob && blob.size > MAX_AVATAR_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.1);
    blob = await toBlob(quality);
  }

  if (!blob) {
    throw new Error('Αποτυχία μετατροπής εικόνας');
  }

  return { blob, width: outputSize, height: outputSize };
};

/**
 * Processes a general image (maintains aspect ratio):
 * - Resizes if larger than max dimensions
 * - Compresses for optimal file size
 */
export const processImage = async (
  file: File, 
  maxWidth: number = 1200, 
  maxHeight: number = 1200
): Promise<ProcessedImage> => {
  const img = await loadImageFromFile(file);
  
  let { naturalWidth: width, naturalHeight: height } = img;
  
  // Calculate new dimensions maintaining aspect ratio
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  
  // Create canvas for processing
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Αποτυχία δημιουργίας canvas context');
  }
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw resized image
  ctx.drawImage(img, 0, 0, width, height);
  
  // Clean up object URL
  URL.revokeObjectURL(img.src);
  
  // Convert to blob with compression
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, width, height });
        } else {
          reject(new Error('Αποτυχία μετατροπής εικόνας'));
        }
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
};
