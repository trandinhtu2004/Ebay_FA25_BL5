// models/Product.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    // ... (Các trường cũ: title, description, price, images, category, seller, isAuction, auctionEndTime, stock - giữ nguyên)
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String, required: true }],
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isAuction: { type: Boolean, default: false },
    auctionEndTime: { type: Date },
    stock: { type: Number, required: true, default: 1 },

    // --- TRƯỜNG MỚI CHO ĐÁNH GIÁ ---
    rating: { // Điểm trung bình
        type: Number,
        required: true,
        default: 0
    },
    numReviews: { // Số lượng đánh giá
        type: Number,
        required: true,
        default: 0
    },
    isActive: { type: Boolean, default: true }, // Trạng thái ẩn/hiện

    // --- TRƯỜNG MỚI ---
    violationReason: { // Lý do Admin ẩn sản phẩm
        type: String,
        default: '' // Mặc định là trống
    }

}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);