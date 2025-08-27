// Optimized image URL function with automatic cache busting
export const getImageUrl = (imagePath, bustCache = false) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return '/placeholder-image.jpg';
  }
  
  // Return Cloudinary URLs directly with optimization
  if (imagePath.startsWith('https://res.cloudinary.com')) {
    // Add Cloudinary optimizations for better performance
    if (imagePath.includes('/upload/') && !imagePath.includes('f_auto')) {
      return imagePath.replace('/upload/', '/upload/f_auto,q_auto,c_scale,w_800/');
    }
    return imagePath;
  }
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Handle local uploads - ensure proper URL construction
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const cleanPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
  let finalUrl = `${baseUrl}${cleanPath}`;
  
  // Add cache busting parameter for updated images
  if (bustCache) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${separator}t=${Date.now()}`;
  }
  
  return finalUrl;
};

// Helper function to get image URL with cache busting for admin updates
export const getUpdatedImageUrl = (imagePath, timestamp) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return '/placeholder-image.jpg';
  }
  
  // For Cloudinary URLs, add version parameter
  if (imagePath.startsWith('https://res.cloudinary.com')) {
    const separator = imagePath.includes('?') ? '&' : '?';
    return `${imagePath}${separator}v=${timestamp || Date.now()}`;
  }
  
  return getImageUrl(imagePath, true);
};

// Helper function to preload images for better UX
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Helper function to get optimized image URL based on context
export const getOptimizedImageUrl = (imagePath, width = 800, quality = 'auto') => {
  if (!imagePath) return '/placeholder-image.jpg';
  
  if (imagePath.startsWith('https://res.cloudinary.com')) {
    return imagePath.replace('/upload/', `/upload/w_${width},c_scale,f_auto,q_${quality}/`);
  }
  
  return getImageUrl(imagePath);
};
