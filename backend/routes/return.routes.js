// routes/return.routes.js
const express = require('express');
const router = express.Router();
const { createReturnOrderRequest, getMyReturnRequests,
    getAllReturnRequests,      // <-- MỚI (Admin)
    updateReturnRequestStatus
 } = require('../controllers/return.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');

// Bảo vệ tất cả route
router.use(protect);

router.route('/')
    .post(createReturnOrderRequest); // Tạo yêu cầu mới
router.get('/myrequests', getMyReturnRequests); // Lấy lịch sử yêu cầu

router.get('/admin', protect, isAdmin, getAllReturnRequests); // Lấy tất cả hoặc lọc
router.put('/admin/:id', protect, isAdmin, updateReturnRequestStatus);

module.exports = router;