import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        // For regular products
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: false
        },
        // For bundles
        bundleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bundle',
            required: false
        },
        // For gift boxes
        giftBoxId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GiftBox',
            required: false
        },
        // Item type identifier
        type: {
            type: String,
            enum: ['product', 'bundle', 'giftbox'],
            required: true
        },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        image: String
    }],
    shippingAddress: {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        pincode: { 
            type: String, 
            required: true,
            match: [/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode']
        },
        landmark: { type: String, trim: true },
        phoneNumber: { 
            type: String,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number']
        }
    },
    pricing: {
        subtotal: { type: Number, required: true, min: 0 },
        tax: { type: Number, required: true, min: 0 },
        shipping: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 }
    },
    paymentInfo: {
        method: {
            type: String,
            enum: ['cod', 'bank_transfer'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded', 'verification_pending'],
            default: 'pending'
        },
        paymentScreenshot: {
            filename: String,
            path: String,
            uploadedAt: Date
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        verifiedAt: Date,
        paidAt: Date,
        failureReason: String,
        adminNotes: String
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        note: String,
        updatedBy: String,
        timestamp: { type: Date, default: Date.now }
    }],
    trackingInfo: {
        trackingNumber: String,
        carrier: String,
        trackingUrl: String,
        estimatedDelivery: Date
    },
    deliveryDate: Date,
    cancelReason: String,
    returnReason: String,
    notes: String,
    
    // Additional fields for better order management
    expectedDeliveryDate: Date,
    actualDeliveryDate: Date,
    isGift: { type: Boolean, default: false },
    giftMessage: String,
    specialInstructions: String
}, {
    timestamps: true
});

// Generate order number before saving - FIXED VERSION
orderSchema.pre('save', async function(next) {
    try {
        if (!this.orderNumber) {
            // Get the count of existing orders
            const count = await this.constructor.countDocuments();
            
            // Generate a unique order number
            const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
            const orderCount = (count + 1).toString().padStart(4, '0');
            const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
            
            this.orderNumber = `ORD${timestamp}${orderCount}${randomSuffix}`;
            
            console.log('🔢 Generated order number:', this.orderNumber);
        }
        next();
    } catch (error) {
        console.error('❌ Error generating order number:', error);
        next(error);
    }
});

// Validate pricing consistency
orderSchema.pre('save', function(next) {
    try {
        const calculatedTotal = this.pricing.subtotal + this.pricing.tax + this.pricing.shipping - this.pricing.discount;
        if (Math.abs(calculatedTotal - this.pricing.total) > 0.01) { // Allow for small rounding differences
            return next(new Error('Pricing calculation mismatch'));
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Add initial status to history - FIXED VERSION
orderSchema.pre('save', function(next) {
    try {
        if (this.isNew && this.statusHistory.length === 0) {
            this.statusHistory.push({
                status: this.status,
                note: 'Order created',
                timestamp: new Date()
            });
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'paymentInfo.method': 1 });
orderSchema.index({ 'paymentInfo.status': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
    return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24)); // Days
});

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
    const cancellableStatuses = ['pending', 'confirmed'];
    return cancellableStatuses.includes(this.status);
};

// Method to check if order can be returned
orderSchema.methods.canBeReturned = function() {
    if (this.status !== 'delivered') return false;
    const deliveryDate = this.deliveryDate || this.createdAt;
    const daysSinceDelivery = Math.floor((new Date() - deliveryDate) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery <= 7; // 7 days return policy
};

export default mongoose.model('Order', orderSchema);
