// Simple URL-based image function
export const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return '/placeholder-image.jpg';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `${import.meta.env.VITE_API_BASE_URL}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
};