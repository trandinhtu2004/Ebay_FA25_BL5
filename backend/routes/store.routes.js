// routes/store.routes.js
const express = require('express');
const router = express.Router();
const { updateStoreProfile, getMyStore } = require('../controllers/store.controller');
const { protect, isSeller } = require('../middleware/auth.middleware');

// Tất cả các route trong file này đều yêu cầu Đăng nhập và là Seller
router.use(protect, isSeller);

// Nhóm 2: Cập nhật & Lấy hồ sơ cửa hàng 
router
    .route('/me')
    .get(getMyStore)      // Lấy thông tin
    .put(updateStoreProfile); // Cập nhật thông tin

module.exports = router;