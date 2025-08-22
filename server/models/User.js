import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String,
    type: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home'
    },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phoneNumber: {
        type: String,
        trim: true,
        sparse: true,
        match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number']
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    addresses: [addressSchema],
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: false
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        bundleInfo: {
            bundleId: String,
            bundleName: String,
            bundlePrice: Number,
            isBundle: Boolean
        },
        giftBoxInfo: {
            giftBoxId: String,
            giftBoxName: String,
            giftBoxPrice: Number,
            isGiftBox: Boolean
        }
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    otp: {
        code: String,
        expiresAt: Date,
        attempts: { type: Number, default: 0 },
        lastSentAt: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true }
        },
        language: { type: String, default: 'en' }
    }
}, {
    timestamps: true
});


// Remove duplicate index - phoneNumber already has sparse: true in schema definition

export default mongoose.model('User', userSchema);
