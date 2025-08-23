import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/product.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://sindhucrackers.com',
    'https://www.sindhucrackers.com'
  ],
  credentials: true
}));

app.use(express.json());

// Test routes one by one
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Server running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  
  mongoose.connect(process.env.MONGODB)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB error:', err));
});