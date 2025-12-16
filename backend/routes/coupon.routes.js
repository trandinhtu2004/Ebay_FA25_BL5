// routes/coupon.routes.js
const express = require('express');
const router = express.Router();
const { createCoupon, validateCoupon, seedCoupons } = require('../controllers/coupon.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');

// Tạo coupon (Admin)
router.post('/', protect, isAdmin, createCoupon);

// Xác thực coupon (Buyer)
router.post('/validate', protect, validateCoupon);

// Seed data mẫu (Admin) - chỉ dùng để test
router.post('/seed', protect, isAdmin, seedCoupons);

module.exports = router;