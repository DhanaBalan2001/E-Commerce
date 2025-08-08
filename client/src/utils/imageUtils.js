// Image utility functions for compression and validation

/**
 * Compress an image file to reduce its size
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width (default: 1200)
 * @param {number} maxHeight - Maximum height (default: 1200)
 * @param {number} quality - Compression quality 0-1 (default: 0.8)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Image loading failed'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @param {number} maxSize - Maximum file size in bytes (default: 10MB)
 * @returns {Object} - Validation result
 */
export const validateImage = (file, maxSize = 10 * 1024 * 1024) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Invalid file type. Please select a JPEG, PNG, GIF, WebP, or AVIF image.' 
    };
  }

  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `File too large. Maximum size is ${formatFileSize(maxSize)}.` 
    };
  }

  return { isValid: true };
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Create image preview URL
 * @param {File} file - Image file
 * @returns {string} - Preview URL
 */
export const createImagePreview = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revoke image preview URL to free memory
 * @param {string} url - Preview URL to revoke
 */
export const revokeImagePreview = (url) => {
  URL.revokeObjectURL(url);
};

/**
 * Auto-compress image if it's too large
 * @param {File} file - Original image file
 * @param {number} targetSize - Target size in bytes (default: 2MB)
 * @returns {Promise<File>} - Compressed file if needed, original if small enough
 */
export const autoCompressImage = async (file, targetSize = 2 * 1024 * 1024) => {
  if (file.size <= targetSize) {
    return file; // File is already small enough
  }

  console.log(`🗜️ Compressing image: ${formatFileSize(file.size)} → targeting ${formatFileSize(targetSize)}`);
  
  // Start with high quality and reduce if needed
  let quality = 0.9;
  let compressedFile = file;
  
  while (quality > 0.1 && compressedFile.size > targetSize) {
    compressedFile = await compressImage(file, 1200, 1200, quality);
    console.log(`🗜️ Compressed to ${formatFileSize(compressedFile.size)} at quality ${quality}`);
    quality -= 0.1;
  }
  
  return compressedFile;
};