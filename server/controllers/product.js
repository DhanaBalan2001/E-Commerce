import Product from '../models/Product.js';
import { deleteUploadedFile, getImageUrl, uploadFileToCloudinary } from '../middleware/upload.js';
import mongoose from 'mongoose';
import fs from 'fs';

export const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            subCategory,
            minPrice,
            maxPrice,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status
        } = req.query;

        const query = { isActive: true };
        
        // Category filter
        if (category) {
            query.category = category;
        }
        
        // Sub-category filter
        if (subCategory) {
            query.subCategories = { $in: [subCategory] };
        }
        
        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseInt(minPrice);
            if (maxPrice) query.price.$lte = parseInt(maxPrice);
        }
        
        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Stock status filter
        if (status) {
            switch (status) {
                case 'in-stock':
                    query.stock = { $gt: 10 };
                    break;
                case 'low-stock':
                    query.stock = { $gte: 1, $lte: 10 };
                    break;
                case 'out-of-stock':
                    query.stock = 0;
                    break;
            }
        }
        
        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('category', 'name slug')
                .select('name description price originalPrice discount stock images ratings createdAt')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean()
                .maxTimeMS(5000),
            Product.countDocuments(query).maxTimeMS(3000)
        ]);
        
        const totalPages = Math.ceil(total / parseInt(limit));
        
        res.json({
            success: true,
            products,
            total,
            totalPages,
            currentPage: parseInt(page),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
        });
    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
            products: [],
            total: 0
        });
    }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Product ID is required' });

    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .lean();
      
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Convert numeric fields
    if (productData.price) productData.price = parseInt(productData.price, 10);
    if (productData.weight) productData.weight = parseInt(productData.weight, 10);
    if (productData.stock) productData.stock = parseInt(productData.stock, 10);
    if (productData.discount) productData.discount = parseInt(productData.discount, 10);
    if (productData.featured !== undefined) productData.isFeatured = productData.featured === 'true' || productData.featured === true;
    
    // Handle subCategories array
    if (productData.subCategories) {
      try {
        productData.subCategories = typeof productData.subCategories === 'string' 
          ? JSON.parse(productData.subCategories) 
          : productData.subCategories;
      } catch (e) {
        productData.subCategories = [];
      }
    }

    // Handle images from req.files
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => ({
        url: getImageUrl(file.filename),
        filename: file.filename,
        uploadDate: new Date()
      }));
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Product ID is required' });

    console.log('Update product ID:', id);
    console.log('Update product request body:', req.body);
    console.log('Files received:', req.files?.length || 0);

    const updateData = { ...req.body };

    // Convert fields to correct types
    if (updateData.price) updateData.price = parseInt(updateData.price, 10);
    if (updateData.weight) updateData.weight = parseInt(updateData.weight, 10);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock, 10);
    if (updateData.discount) updateData.discount = parseInt(updateData.discount, 10);
    if (updateData.featured !== undefined) updateData.isFeatured = updateData.featured === 'true' || updateData.featured === true;
    
    // Handle subCategories array
    if (updateData.subCategories) {
      try {
        updateData.subCategories = typeof updateData.subCategories === 'string' 
          ? JSON.parse(updateData.subCategories) 
          : updateData.subCategories;
      } catch (e) {
        updateData.subCategories = [];
      }
    }

    // Handle image updates
    let finalImages = [];
    
    // Process existing images that should be kept
    if (updateData.existingImages) {
      try {
        const existingImages = typeof updateData.existingImages === 'string' 
          ? JSON.parse(updateData.existingImages) 
          : updateData.existingImages;
        finalImages = [...existingImages];
        console.log('Keeping existing images:', existingImages.length);
      } catch (e) {
        console.error('Error parsing existing images:', e);
      }
    }
    
    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: getImageUrl(file.filename),
        filename: file.filename,
        uploadDate: new Date()
      }));
      finalImages = [...finalImages, ...newImages];
      console.log('Added new images:', newImages.length);
    }
    
    // Update images in the data
    if (finalImages.length > 0) {
      updateData.images = finalImages;
    }
    
    // Remove the existingImages field as it's not part of the schema
    delete updateData.existingImages;

    console.log('Final images count:', finalImages.length);
    
    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('category', 'name slug');

    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    console.log('Product updated successfully:', product.name);
    console.log('Updated product images:', product.images?.length || 0);
    
    res.status(200).json({ 
      message: 'Product updated successfully', 
      product 
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteProductImage = async (req, res) => {
    try {
        const { productId, imageId } = req.params;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.images = product.images.filter(img => img._id.toString() !== imageId);
        await product.save();

        res.status(200).json({ 
            message: 'Image deleted successfully',
            product 
        });

    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        
        const products = await Product.find({ 
            isActive: true, 
            isFeatured: true 
        })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();
        
        res.json({ 
            success: true,
            products,
            total: products.length
        });
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message,
            products: []
        });
    }
};

export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        console.log(`📋 Getting products for category: ${category}`);

        const products = await Product.find({ 
            category, 
            isActive: true 
        })
        .select('name description price originalPrice stock ratings createdAt')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

        console.log(`✅ Found ${products.length} products in category`);

        res.json({
            success: true,
            products: products,
            total: products.length,
            totalPages: 1,
            currentPage: 1
        });
    } catch (error) {
        console.error('❌ Category products error:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch category products',
            products: [],
            total: 0
        });
    }
};

export const searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ 
                success: false,
                message: 'Search query is required',
                products: []
            });
        }

        console.log(`🔍 Searching for: ${q}`);

        const products = await Product.find({
            isActive: true,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        })
        .select('name description price originalPrice stock ratings createdAt')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

        console.log(`✅ Found ${products.length} search results`);

        res.json({
            success: true,
            products: products,
            total: products.length,
            totalPages: 1,
            currentPage: 1,
            searchQuery: q
        });
    } catch (error) {
        console.error('❌ Search error:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Search failed',
            products: [],
            total: 0
        });
    }
};

export const addProductReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                message: 'Rating must be between 1 and 5' 
            });
        }

        if (!comment || comment.trim().length < 10) {
            return res.status(400).json({ 
                message: 'Comment must be at least 10 characters long' 
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user already reviewed this product
        const existingReview = product.reviews.find(
            review => review.user.toString() === userId
        );

        if (existingReview) {
            return res.status(400).json({ 
                message: 'You have already reviewed this product' 
            });
        }

        // Add new review
        const newReview = {
            user: userId,
            rating: parseInt(rating),
            comment: comment.trim(),
            createdAt: new Date()
        };

        product.reviews.push(newReview);

        // Update ratings
        const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
        product.ratings.average = Math.round((totalRating / product.reviews.length) * 10) / 10;
        product.ratings.count = product.reviews.length;

        await product.save();

        // Populate the new review with user details for response
        await product.populate('reviews.user', 'name');
        const addedReview = product.reviews[product.reviews.length - 1];

        res.status(201).json({
            success: true,
            message: 'Review added successfully',
            review: addedReview,
            product: {
                _id: product._id,
                name: product.name,
                ratings: product.ratings
            }
        });

    } catch (error) {
        console.error('Add product review error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

export const getProductReviews = async (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required.' });
    }

    try {
        const product = await Product.findById(productId).populate('reviews.user', 'name');

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.status(200).json({ reviews: product.reviews });
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getRecentReviews = async (req, res) => {
    try {
        const { limit = 6 } = req.query;

        // Aggregate to get recent reviews across all products
        const recentReviews = await Product.aggregate([
            // Unwind reviews array
            { $unwind: '$reviews' },
            
            // Populate user details
            {
                $lookup: {
                    from: 'users',
                    localField: 'reviews.user',
                    foreignField: '_id',
                    as: 'reviews.user'
                }
            },
            
            // Unwind user array
            { $unwind: '$reviews.user' },
           
            { $sort: { 'reviews.createdAt': -1 } },
           
            { $limit: parseInt(limit) },
            
            {
                $project: {
                    _id: '$reviews._id',
                    rating: '$reviews.rating',
                    comment: '$reviews.comment',
                    createdAt: '$reviews.createdAt',
                    user: {
                        _id: '$reviews.user._id',
                        name: '$reviews.user.name'
                    },
                    product: {
                        _id: '$_id',
                        name: '$name'
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            reviews: recentReviews,
            count: recentReviews.length
        });

    } catch (error) {
        console.error('Get recent reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
