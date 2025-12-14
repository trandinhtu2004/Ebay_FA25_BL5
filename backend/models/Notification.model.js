// models/Notification.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    user: { // Người nhận thông báo
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: { // Nội dung thông báo
        type: String,
        required: true
    },
    link: { // Link đến trang liên quan (ví dụ: đơn hàng)
        type: String
    },
    isRead: { // Trạng thái đã đọc
        type: Boolean,
        default: false
    },
    type: { // Loại thông báo (order, system, promo, etc.)
        type: String,
        enum: ['order', 'system', 'promotion', 'update', 'general'],
        default: 'general'
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);