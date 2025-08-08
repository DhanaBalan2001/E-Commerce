import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    images: [{
        url: { type: String, required: true }, // image URL path
        filename: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now }
    }],
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    minOrderQuantity: {
        type: Number,
        default: 1,
        min: 1
    },
    maxOrderQuantity: {
        type: Number,
        default: 100
    },
    weight: {
        type: Number, // in grams
        required: true
    },
    unit: {
        type: String,
        required: true,
        enum: ['piece', 'box', 'kg', 'g', 'oz', 'l', 'ml', 'dozen', 'pack']
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },
    safetyInstructions: [String],
    ageRestriction: {
        type: Number,
        default: 18
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    tags: [String],
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Text search index for search functionality
productSchema.index({ 
    name: 'text', 
    description: 'text', 
    tags: 'text' 
});

// Compound indexes for better query performance
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ 'ratings.average': -1 });

// Debug middleware to track stock changes
productSchema.pre('findOneAndUpdate', function() {
  console.log('Pre-update middleware - Update data:', this.getUpdate());
});

productSchema.post('findOneAndUpdate', function(doc) {
  if (doc) {
    console.log('Post-update middleware - Final stock:', doc.stock);
  }
});

export default mongoose.model('Product', productSchema);
