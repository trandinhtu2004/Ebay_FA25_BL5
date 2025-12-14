// routes/payment.routes.js
const express = require('express');
const router = express.Router();
const { createVNPayPayment, handleVNPayReturn } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

// Giả lập tạo URL (Cần đăng nhập)
router.post('/vnpay', protect, createVNPayPayment);

// Giả lập VNPay gọi về (Public)
router.get('/vnpay_return', handleVNPayReturn);

// (Thêm /paypal sau)

module.exports = router;