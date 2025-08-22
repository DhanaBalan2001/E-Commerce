import mongoose from 'mongoose';

// Database connection pool optimization
export const optimizeDatabase = () => {
  // Connection pool settings for high concurrency
  mongoose.set('maxPoolSize', 50);
  mongoose.set('minPoolSize', 5);
  mongoose.set('maxIdleTimeMS', 30000);
  mongoose.set('serverSelectionTimeoutMS', 5000);
  mongoose.set('socketTimeoutMS', 45000);
  mongoose.set('bufferMaxEntries', 0);
  mongoose.set('bufferCommands', false);
  
  // Enable connection monitoring
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected with optimized pool');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
  });
};

// Query optimization middleware
export const queryOptimization = {
  // Lean queries for better performance
  lean: true,
  
  // Default pagination
  defaultLimit: 20,
  maxLimit: 100,
  
  // Index hints for common queries
  addIndexHints: (query, collection) => {
    switch (collection) {
      case 'products':
        return query.hint({ category: 1, isActive: 1 });
      case 'orders':
        return query.hint({ user: 1, createdAt: -1 });
      default:
        return query;
    }
  }
};

// Connection health check
export const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    
    if (state !== 1) {
      throw new Error(`Database not connected: ${states[state]}`);
    }
    
    // Quick ping test
    await mongoose.connection.db.admin().ping();
    return { status: 'healthy', state: states[state] };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};