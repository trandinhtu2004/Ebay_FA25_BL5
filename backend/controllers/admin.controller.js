// controllers/admin.controller.js
const User = require('../models/User.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');

// @desc    Lấy số liệu tổng quan (Admin)
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments(); // Có thể lọc theo isActive: true
        const orderCount = await Order.countDocuments();
        // (Thêm các thống kê khác sau)

        res.status(200).json({
            users: userCount,
            products: productCount,
            orders: orderCount
        });
    } catch (error) {
        console.error("Lỗi lấy stats:", error);
        res.status(500).json({ message: "Lỗi máy chủ." });
    }
};