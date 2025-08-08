import { body, validationResult } from 'express-validator';

export const validateEmail = (req, res, next) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    
    next();
};

export const validateOTP = (req, res, next) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }
    
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    
    if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ message: 'OTP must be 6 digits' });
    }
    
    next();
};

export const validateProduct = (req, res, next) => {
    const { name, description, price, category, subCategories, weight, stock, unit } = req.body;
    
    if (!name || !description || !price || !category || !weight || !stock || !unit) {
        return res.status(400).json({ 
            message: 'Name, description, price, category, weight, stock, and unit are required' 
        });
    }
    
    // Validate subCategories
    if (!subCategories) {
        return res.status(400).json({ 
            message: 'At least one subcategory is required' 
        });
    }
    
    // Parse subCategories if it's a string
    let parsedSubCategories;
    try {
        parsedSubCategories = typeof subCategories === 'string' ? JSON.parse(subCategories) : subCategories;
    } catch (e) {
        return res.status(400).json({ 
            message: 'Invalid subcategories format' 
        });
    }
    
    if (!Array.isArray(parsedSubCategories) || parsedSubCategories.length === 0) {
        return res.status(400).json({ 
            message: 'At least one subcategory is required' 
        });
    }
    
    if (price <= 0) {
        return res.status(400).json({ message: 'Price must be greater than 0' });
    }
    
    if (weight <= 0) {
        return res.status(400).json({ message: 'Weight must be greater than 0' });
    }
    
    if (stock < 0) {
        return res.status(400).json({ message: 'Stock cannot be negative' });
    }
    
    next();
};


export const validatePhoneNumber = (req, res, next) => {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
    }
    
    const cleanPhoneNumber = phoneNumber.replace('+91', '').replace(/\s+/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhoneNumber)) {
        return res.status(400).json({ message: 'Please enter a valid Indian phone number' });
    }
    
    next();
};

export const validateOrder = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    body('shippingAddress.street')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Street address is required'),
    body('shippingAddress.city')
        .trim()
        .isLength({ min: 1 })
        .withMessage('City is required'),
    body('shippingAddress.state')
        .trim()
        .isLength({ min: 1 })
        .withMessage('State is required'),
    body('shippingAddress.pincode')
        .matches(/^\d{6}$/)
        .withMessage('Please enter a valid 6-digit pincode'),
    body('paymentMethod')
        .isIn(['cod', 'razorpay'])
        .withMessage('Invalid payment method'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }
        next();
    }
];

export const validateReview = (req, res, next) => {
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
        return res.status(400).json({ 
            message: 'Rating and comment are required' 
        });
    }
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
            message: 'Rating must be between 1 and 5' 
        });
    }
    
    if (comment.trim().length < 10) {
        return res.status(400).json({ 
            message: 'Comment must be at least 10 characters long' 
        });
    }
    
    if (comment.trim().length > 500) {
        return res.status(400).json({ 
            message: 'Comment must not exceed 500 characters' 
        });
    }
    
    next();
};
