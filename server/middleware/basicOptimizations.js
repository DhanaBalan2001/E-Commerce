// Basic optimizations that work without additional dependencies

// Enhanced rate limiting for high traffic
export const enhancedRateLimit = (req, res, next) => {
  // Add response headers for better caching
  if (req.method === 'GET' && req.path.includes('/api/products')) {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  }
  
  if (req.method === 'GET' && req.path.includes('/api/categories')) {
    res.set('Cache-Control', 'public, max-age=600'); // 10 minutes
  }
  
  next();
};

// Connection optimization
export const connectionOptimizer = (req, res, next) => {
  res.set('Connection', 'keep-alive');
  res.set('Keep-Alive', 'timeout=5, max=1000');
  next();
};

// Request size limiter for security
export const requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.get('content-length') || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    return res.status(413).json({ message: 'Request too large' });
  }
  next();
};

// Simple health monitoring
export const healthMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  // Log high memory usage
  if (heapUsedMB > 200) {
    console.warn(`⚠️ High memory usage: ${heapUsedMB}MB`);
  }
  
  // Add memory info to response headers for monitoring
  res.set('X-Memory-Usage', heapUsedMB.toString());
  next();
};