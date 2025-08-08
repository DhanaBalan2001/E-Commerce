import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true
    },
    description: String,
    image: String,
    isActive: {
        type: Boolean,
        default: true
    }
});

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    image: String,
    icon: String,
    subCategories: [subCategorySchema],
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String]
}, {
    timestamps: true
});

export default mongoose.model('Category', categorySchema);