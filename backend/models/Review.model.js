// backend/models/Review.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    reviewer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    }
}, { timestamps: true });

ReviewSchema.index({ product: 1, reviewer: 1 }, { unique: true });

// ĐẢM BẢO BẠN DÙNG DÒNG NÀY Ở CUỐI:
module.exports = mongoose.model('Review', ReviewSchema);