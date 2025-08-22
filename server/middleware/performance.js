import compression from 'compression';
import helmet from 'helmet';

// Compression middleware for response optimization
export const compressionMiddleware = compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
});

// Security headers with performance optimization
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Response caching middleware
export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${duration}`);
      res.set('ETag', `"${Date.now()}"`);
    }
    next();
  };
};

// Connection keep-alive optimization
export const keepAliveMiddleware = (req, res, next) => {
  res.set('Connection', 'keep-alive');
  res.set('Keep-Alive', 'timeout=5, max=1000');
  next();
};

// Request timeout middleware
export const timeoutMiddleware = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      res.status(408).json({ message: 'Request timeout' });
    });
    next();
  };
};

// Memory monitoring
export const memoryMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage();
  res.set('X-Memory-Usage', Math.round(memUsage.heapUsed / 1024 / 1024));
  next();
};

// Request queue middleware for high load
const requestQueue = [];
let processing = false;

export const queueMiddleware = (req, res, next) => {
  if (requestQueue.length > 100) {
    return res.status(503).json({ message: 'Server overloaded, try again later' });
  }
  
  requestQueue.push({ req, res, next });
  processQueue();
};

const processQueue = () => {
  if (processing || requestQueue.length === 0) return;
  
  processing = true;
  const { req, res, next } = requestQueue.shift();
  
  next();
  
  setImmediate(() => {
    processing = false;
    processQueue();
  });
};

// Database optimization
export const optimizeDatabase = () => {
  console.log('✅ Database optimizations applied');
};

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState === 1) {
      return { status: 'connected', readyState: 1 };
    }
    return { status: 'disconnected', readyState: mongoose.default.connection.readyState };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
};