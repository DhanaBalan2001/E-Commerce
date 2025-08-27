import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter function to validate file types
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif'
    ];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();
    
    if (allowedExtensions.includes(fileExtension) && allowedMimeTypes.includes(mimeType)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file extension. Allowed: jpg, jpeg, png, gif, webp, avif'), false);
    }
};

export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // Increased to 10MB
        fieldSize: 10 * 1024 * 1024 // Also increase field size limit
    }
});

// Helper function to delete uploaded file
export const deleteUploadedFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️ Deleted file:', filePath);
        }
    } catch (error) {
        console.error('❌ Error deleting file:', error);
    }
};

// Helper function to format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Multer error handler middleware
export const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size allowed is 10MB.',
                    error: 'FILE_TOO_LARGE',
                    maxSize: '10MB'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Too many files uploaded.',
                    error: 'TOO_MANY_FILES'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected file field.',
                    error: 'UNEXPECTED_FILE'
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: 'File upload error.',
                    error: error.code
                });
        }
    } else if (error) {
        // Handle file filter errors
        if (error.message && error.message.includes('Invalid file extension')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                error: 'INVALID_FILE_TYPE'
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message || 'File upload error.',
            error: 'UPLOAD_ERROR'
        });
    }
    next();
};

// Helper function to get image URL
export const getImageUrl = (filename) => {
    return `/uploads/${filename}`;
};

// Helper function to get full image URL with base URL
export const getFullImageUrl = (filename, baseUrl) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename; // Already full URL
    return `${baseUrl}/uploads/${filename}`;
};

// Helper function to upload to Cloudinary
export const uploadFileToCloudinary = async (filePath, folder = 'crackers') => {
    try {
        const cloudinaryUrl = await uploadToCloudinary(filePath, folder);
        // Delete local file after successful upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return cloudinaryUrl;
    } catch (error) {
        // Clean up local file if upload fails
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw error;
    }
};
