import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

// Helper: public GET routes that should not be rate-limited
const publicGetRoutes = [
  '/api/categories',
  '/api/products',
  '/api/brands',
  '/api/health'
];

// Enhanced rate limiter with burst handling
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    if (req.path.includes('/auth/')) return 100;
    if (req.path.includes('/payment/')) return 50;
    if (req.method === 'GET') return 2000;
    return process.env.NODE_ENV === 'production' ? 500 : 2000;
  },
  keyGenerator: (req) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT);
        return `user_${decoded.id}_${decoded.type || 'user'}`;
      } catch (error) {
        return `ip_${req.ip}`;
      }
    }
    return `ip_${req.ip}`;
  },
  skip: (req) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token && req.path.includes('/admin/') && !req.path.includes('/admin/auth/')) {
      try {
        const decoded = jwt.verify(token, process.env.JWT);
        if (decoded.type === 'admin') return true;
      } catch (error) {}
    }
    
    return (
      req.method === 'OPTIONS' ||
      publicGetRoutes.includes(req.path) ||
      (req.method === 'GET' && publicGetRoutes.some(route => req.path.startsWith(route)))
    );
  },
  message: {
    message: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// OTP rate limiter - DISABLED for better user experience
export const otpRateLimiter = (req, res, next) => {
  next(); // Skip rate limiting for OTP requests
};

// Admin login limiter (strict, separate)
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 50,
  message: {
    message: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
