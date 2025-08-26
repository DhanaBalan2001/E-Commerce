// Simple URL-based image function with cache busting
export const getImageUrl = (imagePath, bustCache = false) => {
  if (!imagePath || typeof imagePath !== 'string') {
    console.log('❌ Invalid image path:', imagePath);
    return '/placeholder-image.jpg';
  }
  
  // Return Cloudinary URLs directly
  if (imagePath.startsWith('https://res.cloudinary.com')) {
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
  
  console.log('🖼️ Image URL generated:', finalUrl);
  return finalUrl;
};
