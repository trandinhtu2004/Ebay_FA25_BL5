// models/ReturnRequest.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReturnRequestSchema = new Schema({
    order: { // Tham chiếu đến đơn hàng gốc [cite: 214]
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    user: { // Người yêu cầu (buyer) [cite: 217]
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Chúng ta nên cho phép chọn sản phẩm cụ thể muốn trả
    // (Tạm thời là trả cả đơn hoặc 1 sản phẩm chính)
    product: { // Sản phẩm muốn trả (tùy chọn, nếu chỉ trả 1 món)
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    reason: { // Lý do hoàn trả [cite: 222]
        type: String,
        required: [true, 'Lý do là bắt buộc']
    },
    status: { // Trạng thái yêu cầu [cite: 229]
        type: String,
        enum: ['pending', 'approved', 'rejected', 'processing', 'completed'],
        default: 'pending'
    },
    // Thêm trường để admin/seller phản hồi
    resolutionNotes: {
        type: String
    }
}, { timestamps: true }); // 'createdAt' [cite: 237]

module.exports = mongoose.model('ReturnRequest', ReturnRequestSchema);