// models/Order.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Đây là OrderItemSchema (sản phẩm con trong đơn hàng)
const OrderItemSchema = new Schema({
    title: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    product: { // Giữ tham chiếu đến sản phẩm gốc
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }
}, { _id: false });


// Đây là OrderSchema (đơn hàng chính)
const OrderSchema = new Schema({
    buyer: { // Đổi 'buyerId' thành 'buyer'
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Chúng ta sẽ nhúng (embed) địa chỉ vào đơn hàng
    // để dù user có xóa địa chỉ thì đơn hàng vẫn còn lưu
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        country: { type: String, required: true }
    },
    orderItems: [OrderItemSchema],
    
    paymentMethod: {
        type: String,
        required: true,
        enum: ['COD', 'PayPal', 'VNPay'] // Các phương thức
    },
    
    // Tính toán giá
    itemsPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 }, // Sẽ thêm logic sau
    totalPrice: { type: Number, required: true, default: 0.0 },

    // Trạng thái đơn hàng [cite: 30]
    status: {
        type: String,
        required: true,
        enum: ['pending_payment', 'pending_confirmation', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending_payment'
    },
    
    // Trạng thái thanh toán
    paymentResult: {
        id: { type: String }, // ID giao dịch từ VNPay/PayPal
        status: { type: String }, // (paid, unpaid, failed)
        update_time: { type: String },
        email_address: { type: String }
    },
    paidAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // --- TRƯỜNG SELLER MỚI THÊM VÀO ĐÂY (NẾU MỖI ĐƠN HÀNG CÓ MỘT SELLER CHÍNH) ---
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true, // Tùy chọn: có bắt buộc phải có seller không
    },
}, { timestamps: true }); // 'createdAt' sẽ là 'orderDate'

module.exports = mongoose.model('Order', OrderSchema);