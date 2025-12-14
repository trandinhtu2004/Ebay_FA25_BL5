// routes/order.routes.js
const express = require('express');
const router = express.Router();
const { createOrder,getMyOrders,getOrderById,getSellerOrders,
    getAllOrdersAdmin,   // <-- MỚI
    updateOrderStatus } = require('../controllers/order.controller');
const { protect, isSeller } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/auth.middleware');


// Bảo vệ tất cả route
router.use(protect);

// API tạo đơn hàng
router.post('/', createOrder);

// API lấy lịch sử đơn hàng (PHẢI TRƯỚC /:id)
router.get('/myorders', getMyOrders);

// API lấy chi tiết đơn hàng (PHẢI SAU /myorders)
router.get('/:id', getOrderById);

router.get('/seller/all', protect, isSeller, getSellerOrders); // Đổi tên để tránh xung đột
router.put('/seller/:id/status', protect, isSeller, updateOrderStatus);


router.get('/admin/all', protect, isAdmin, getAllOrdersAdmin);
module.exports = router;