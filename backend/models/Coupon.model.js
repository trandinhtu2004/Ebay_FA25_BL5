// models/Coupon.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CouponSchema = new Schema({
    code: { // Mã coupon, ví dụ: "SUMMER20" [cite: 170-171]
        type: String,
        required: true,
        unique: true,
        uppercase: true, // Lưu mã dạng chữ hoa
        trim: true
    },
    discountPercent: { // Phần trăm giảm giá [cite: 174-175]
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    startDate: { // Ngày bắt đầu hiệu lực [cite: 178-179]
        type: Date,
        required: true
    },
    endDate: { // Ngày hết hiệu lực [cite: 183]
        type: Date,
        required: true
    },
    maxUsage: { // Số lần sử dụng tối đa (tổng cộng) [cite: 188-189]
        type: Number,
        required: true,
        default: 1 // Mặc định chỉ dùng 1 lần
    },
    // Số lần đã sử dụng
    timesUsed: {
        type: Number,
        default: 0
    },
    // Áp dụng cho sản phẩm cụ thể (tùy chọn)
    productId: { // [cite: 176-177]
        type: Schema.Types.ObjectId,
        ref: 'Product',
        default: null // null nghĩa là áp dụng cho toàn bộ giỏ hàng
    },
    // Giới hạn giá trị đơn hàng tối thiểu
    minOrderAmount: {
        type: Number,
        default: 0
    },
    // Kích hoạt/Vô hiệu hóa
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);