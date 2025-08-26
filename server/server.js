import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import cluster from 'cluster';
import os from 'os';

// Routes
import authRoutes from './routes/auth.js';
import adminAuthRoutes from './routes/admin.js';
import productRoutes from './routes/product.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';
import categoryRoutes from './routes/category.js';
import addressRoutes from './routes/address.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import paymentRoutes from './routes/payment.js';
import seoRoutes from './routes/seo.js';
import bundleRoutes from './routes/bundleRoutes.js';
import giftBoxRoutes from './routes/giftBoxRoutes.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import {
  rateLimiter,
  otpRateLimiter,
  adminLoginLimiter
} from './middleware/rateLimiter.js';
// Performance middleware
import { 
  compressionMiddleware, 
  cacheMiddleware,
  memoryMonitor,
  queueMiddleware,
  optimizeDatabase,
  checkDatabaseHealth
} from './middleware/performance.js';
import {
  enhancedRateLimit,
  connectionOptimizer,
  requestSizeLimiter,
  healthMonitor
} from './middleware/basicOptimizations.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start server directly for now
startServer();

function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Optimize server settings for high concurrency
  server.timeout = 30000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.maxConnections = 1000;

  const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://sindhucrackers.com',
        'https://www.sindhucrackers.com',
        'https://crackershop.netlify.app',
        process.env.FRONTEND_URL
      ].filter(Boolean),
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling']
  });
  let port = process.env.PORT || 5000;

  // Make io available globally
  app.set('io', io);
  
  // Initialize database optimizations
  optimizeDatabase();

  // Performance middleware
  app.use(compressionMiddleware);
  app.use(connectionOptimizer);
  app.use(requestSizeLimiter);
  app.use(healthMonitor);
  app.use(enhancedRateLimit);
  
  // CORS with optimizations
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000', 
      'https://sindhucrackers.com',
      'https://www.sindhucrackers.com',
      'https://crackershop.netlify.app',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'x-admin-request'],
    maxAge: 86400 // Cache preflight for 24 hours
  }));

  app.use(express.json({ limit: '10mb' })); // Reduced from 50mb
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads with caching
  app.use('/uploads', cacheMiddleware(3600), express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1h',
    etag: true,
    lastModified: true
  }));

// Handle multer errors globally
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 10MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
  }
  next(error);
});

// Remove all timeout restrictions
app.use((req, res, next) => {
  req.setTimeout(0);
  res.setTimeout(0);
  next();
});

// Prevent 431 Request Header Fields Too Large
app.use((req, res, next) => {
  const headerSize = JSON.stringify(req.headers).length;
  if (headerSize > 8192) {
    return res.status(431).json({ error: 'Request header fields too large' });
  }
  next();
});

  // Request queuing for high load
  app.use(queueMiddleware);
  
  // Apply rate limiter to all API routes
  app.use('/api', rateLimiter);
  
  // Special limiters for sensitive endpoints
  app.use('/api/auth/otp', otpRateLimiter);
  app.use('/api/admin/auth/login', adminLoginLimiter);

  // Register routes with caching for read-only endpoints
  app.use('/api/categories', cacheMiddleware(300), categoryRoutes);
  app.use('/api/products', cacheMiddleware(180), productRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin/auth', adminAuthRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/addresses', addressRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/bundles', cacheMiddleware(300), bundleRoutes);
  app.use('/api/giftboxes', cacheMiddleware(300), giftBoxRoutes);
  app.use('/', seoRoutes);

// Root route to show server is running
app.get('/', (req, res) => {
  res.json({
    message: '🎆 Crackers E-Commerce Server is Running!',
    status: 'Active',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      auth: '/api/auth',
      admin: '/api/admin'
    }
  });
});



  // Enhanced health check
  app.get('/api/health', async (req, res) => {
    try {
      const dbHealth = await checkDatabaseHealth();
      const memUsage = process.memoryUsage();
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbHealth,
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024)
        },
        uptime: Math.round(process.uptime()),
        pid: process.pid
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });



// Error handler
app.use(errorHandler);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

  // Optimized Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Rate limit socket events
    const eventCounts = new Map();
    const resetInterval = setInterval(() => eventCounts.clear(), 60000);
    
    socket.use((packet, next) => {
      const event = packet[0];
      const count = eventCounts.get(event) || 0;
      
      if (count > 50) { // 50 events per minute limit
        return next(new Error('Rate limit exceeded'));
      }
      
      eventCounts.set(event, count + 1);
      next();
    });
    
    socket.on('join-order', (orderId) => {
      if (orderId && typeof orderId === 'string') {
        socket.join(`order-${orderId}`);
      }
    });

    socket.on('leave-order', (orderId) => {
      if (orderId && typeof orderId === 'string') {
        socket.leave(`order-${orderId}`);
      }
    });

    socket.on('disconnect', () => {
      clearInterval(resetInterval);
      console.log(`Socket disconnected: ${socket.id}`);
    });
    
    socket.on('error', (error) => {
      console.error(`Socket error: ${error.message}`);
    });
  });

  // Connect to MongoDB first
  mongoose.connect(process.env.MONGODB, {
    maxPoolSize: 50,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  })
    .then(async () => {
      console.log('✅ MongoDB Connected with optimized pool');
      
      // Test Cloudinary connection
      try {
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
          const { v2: cloudinary } = await import('cloudinary');
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
          });
          await cloudinary.api.ping();
          console.log('✅ Cloudinary Connected');
        } else {
          console.log('⚠️ Cloudinary credentials not configured - using local storage');
        }
      } catch (error) {
        console.log('❌ Cloudinary Connection Failed:', error.message);
      }
      
      try {
        await mongoose.connection.db.collection('users').dropIndex('phoneNumber_1');
      } catch (error) {
        // Index not found or already dropped
      }
      
      // Start server after DB connection
      server.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`👍 Health check: http://localhost:${port}/api/health`);
      });
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
      process.exit(1);
    });

  // Error handling
  process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
  });
}