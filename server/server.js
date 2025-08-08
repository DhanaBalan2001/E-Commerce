import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
server.timeout = 0;
server.keepAliveTimeout = 0;
server.headersTimeout = 0;

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST']
  },
  pingTimeout: 0,
  pingInterval: 0
});
let port = process.env.PORT || 5000;

// Make io available globally
app.set('io', io);

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

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import {
  rateLimiter,
  otpRateLimiter,
  adminLoginLimiter
} from './middleware/rateLimiter.js';

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads - MUST be before routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Apply rate limiter only to auth routes and public endpoints
app.use('/api/auth', rateLimiter);
app.use('/api/admin/auth', rateLimiter);

// Special limiters for sensitive endpoints only
app.use('/api/auth/otp', otpRateLimiter);
app.use('/api/admin/auth/login', adminLoginLimiter);

// Register routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

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

// Health check (excluded from rate limit by middleware)
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbState = mongoose.connection.readyState;
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    
    // Quick product count test
    let productCount = 'N/A';
    if (dbState === 1) {
      try {
        const Product = mongoose.model('Product');
        productCount = await Product.countDocuments();
      } catch (err) {
        productCount = `Error: ${err.message}`;
      }
    }
    
    res.status(200).json({
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStates[dbState] || 'unknown',
        productCount
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple products test endpoint
app.get('/api/products-test', async (req, res) => {
  const startTime = Date.now();
  try {
    const Product = mongoose.model('Product');
    
    console.log('🔍 Testing simple product query...');
    const products = await Product.find({ isActive: true })
      .select('name price stock')
      .limit(5)
      .lean()
      .maxTimeMS(10000); // 10 second timeout
    
    const duration = Date.now() - startTime;
    console.log(`✅ Test query completed in ${duration}ms`);
    
    res.json({
      success: true,
      count: products.length,
      products,
      queryTime: duration
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Test query failed in ${duration}ms:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      queryTime: duration
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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join order room for real-time updates
  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`User ${socket.id} joined order room: ${orderId}`);
  });

  // Leave order room
  socket.on('leave-order', (orderId) => {
    socket.leave(`order-${orderId}`);
    console.log(`User ${socket.id} left order room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server with port conflict handling
const startServer = () => {
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);

    mongoose.connect(process.env.MONGODB)
      .then(async () => {
        console.log('MongoDB Connected...');
        
        // Drop the old phoneNumber index
        try {
          await mongoose.connection.db.collection('users').dropIndex('phoneNumber_1');
          console.log('✅ Dropped old phoneNumber index');
        } catch (error) {
          console.log('ℹ️ phoneNumber index not found or already dropped');
        }
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
      });
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying port ${port + 1}`);
      port = port + 1;
      setTimeout(startServer, 1000);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer();

// Handle unexpected errors
process.on('unhandledRejection', (err) => {
  console.error(' Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
