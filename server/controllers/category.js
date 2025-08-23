import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { deleteUploadedFile, getImageUrl, uploadFileToCloudinary } from '../middleware/upload.js';

export const getAllCategories = async (req, res) => {
    try {
        const { 
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        const query = {};
        
        // Status filter
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }
        
        // Sort options
        let sortOptions = {};
        if (sortBy.includes('-')) {
            const [field, order] = sortBy.split('-');
            sortOptions[field] = order === 'desc' ? -1 : 1;
        } else {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }
        
        const categories = await Category.find(query)
            .sort(sortOptions)
            .lean();
        
        // Add product count for each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const productCount = await Product.countDocuments({ 
                    category: category._id,
                    isActive: true 
                });
                return {
                    ...category,
                    productCount
                };
            })
        );
        
        res.json({ 
            success: true,
            categories: categoriesWithCount,
            total: categoriesWithCount.length
        });
    } catch (error) {
        console.error('Get all categories error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message,
            categories: []
        });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const categoryObj = category.toObject();
        
        res.status(200).json({ category: categoryObj });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, description, subCategories, icon, sortOrder, seoTitle, seoDescription, seoKeywords } = req.body;
        
        console.log('📁 Creating category:', { name, hasFile: !!req.file });
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }
        
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        let imageData = null;
        if (req.file) {
            console.log('🖼️ File uploaded:', {
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            });
            imageData = await uploadFileToCloudinary(req.file.path, 'categories');
        }

        let parsedSubCategories = [];
        if (subCategories) {
            try {
                parsedSubCategories = typeof subCategories === 'string' 
                    ? JSON.parse(subCategories) 
                    : subCategories;
                
                parsedSubCategories = parsedSubCategories.map(sub => ({
                    ...sub,
                    slug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                }));
            } catch (error) {
                console.error('Error parsing subCategories:', error);
                parsedSubCategories = [];
            }
        }

        let parsedSeoKeywords = [];
        if (seoKeywords) {
            try {
                parsedSeoKeywords = typeof seoKeywords === 'string' 
                    ? JSON.parse(seoKeywords) 
                    : seoKeywords;
            } catch (error) {
                parsedSeoKeywords = typeof seoKeywords === 'string' 
                    ? seoKeywords.split(',').map(k => k.trim()) 
                    : [];
            }
        }

        const category = new Category({
            name,
            slug,
            description,
            image: imageData,
            icon,
            subCategories: parsedSubCategories,
            sortOrder: sortOrder ? parseInt(sortOrder) : 0,
            seoTitle,
            seoDescription,
            seoKeywords: parsedSeoKeywords
        });

        await category.save();

        const responseCategory = category.toObject();

        console.log('✅ Category created successfully:', responseCategory.name);
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category: responseCategory
        });
    } catch (error) {
        console.error('❌ Create category error:', error);
        
        // Clean up uploaded file if category creation fails
        if (req.file) {
            deleteUploadedFile(req.file.path);
        }
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                message: 'Category name already exists' 
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        console.log('🔄 Updating category:', id);
        console.log('📁 Has file:', !!req.file);
        if (req.file) {
            console.log('🖼️ File details:', {
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            });
        }

        if (updateData.name) {
            updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }

        if (req.file) {
            updateData.image = await uploadFileToCloudinary(req.file.path, 'categories');
            console.log('🖼️ New image URL:', updateData.image);
        }

        if (updateData.subCategories) {
            try {
                updateData.subCategories = typeof updateData.subCategories === 'string' 
                    ? JSON.parse(updateData.subCategories) 
                    : updateData.subCategories;
                
                updateData.subCategories = updateData.subCategories.map(sub => ({
                    ...sub,
                    slug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                }));
            } catch (error) {
                console.error('Error parsing subCategories:', error);
            }
        }

        if (updateData.seoKeywords) {
            try {
                updateData.seoKeywords = typeof updateData.seoKeywords === 'string' 
                    ? JSON.parse(updateData.seoKeywords) 
                    : updateData.seoKeywords;
            } catch (error) {
                updateData.seoKeywords = typeof updateData.seoKeywords === 'string' 
                    ? updateData.seoKeywords.split(',').map(k => k.trim()) 
                    : [];
            }
        }

        const category = await Category.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!category) {
            return res.status(404).json({ 
                success: false,
                message: 'Category not found' 
            });
        }

        const responseCategory = category.toObject();

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            category: responseCategory
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ 
                success: false,
                message: 'Category not found' 
            });
        }

        // Optional: Update products to remove category reference
        await Product.updateMany(
            { category: id },
            { $unset: { category: 1 } }
        );

        res.status(200).json({ 
            success: true,
            message: 'Category deleted successfully' 
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};