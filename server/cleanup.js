import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const cleanup = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB);
        console.log('✅ Connected to MongoDB');

        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📋 Found collections:', collections.map(c => c.name));

        // Clear products and categories collections
        console.log('\n🧹 Cleaning up products...');
        const productsResult = await mongoose.connection.db.collection('products').deleteMany({});
        console.log(`🗑️ Deleted ${productsResult.deletedCount} products`);

        console.log('\n🧹 Cleaning up categories...');
        const categoriesResult = await mongoose.connection.db.collection('categories').deleteMany({});
        console.log(`🗑️ Deleted ${categoriesResult.deletedCount} categories`);

        // Clean up old orders and users (keep recent ones)
        console.log('\n🧹 Cleaning up old orders...');
        const ordersResult = await mongoose.connection.db.collection('orders').deleteMany({
            createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // older than 30 days
        });
        console.log(`🗑️ Deleted ${ordersResult.deletedCount} old orders`);

        console.log('\n✅ Database cleanup completed!');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
};

cleanup();