// backend/controllers/notification.controller.js
const Notification = require('../models/Notification.model');
const notificationEmitter = require('../utils/notificationEmitter'); // Import Emitter

// @desc    Lấy thông báo của user
exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 }).limit(20);
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông báo.' });
    }
};

// @desc    Đánh dấu đã đọc
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo hoặc không có quyền.' });
        }
        res.status(200).json(notification);
    } catch (error) {
        console.error("Lỗi đánh dấu đã đọc:", error);
        res.status(500).json({ message: 'Lỗi máy chủ khi đánh dấu đã đọc.' });
    }
};

// --- HÀM NỘI BỘ (Chỉ lưu DB và phát sự kiện) ---
// Hàm này KHÔNG cần 'req'
exports.createNotificationInternal = async (userId, message, link = '') => {
    console.log(`[Notification Service] Đang tạo thông báo cho user ${userId}. Nội dung: "${message}"`);
    try {
        // 1. Lưu vào DB
        const notification = new Notification({ user: userId, message, link });
        await notification.save();
        console.log(`[Notification Service] Đã lưu thông báo vào DB. ID: ${notification._id}`);

        // 2. Phát sự kiện nội bộ để server.js xử lý
        notificationEmitter.emit('newNotification', {
            userId: userId.toString(), // Gửi userId dạng string
            notificationData: notification.toObject() // Gửi dữ liệu thông báo
        });
        console.log(`[Notification Service] Đã phát sự kiện 'newNotification' cho user ${userId}`);

    } catch (error) {
        console.error(`[Notification Service] Thất bại khi tạo thông báo cho user ${userId}:`, error);
    }
};