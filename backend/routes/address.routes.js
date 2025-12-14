// routes/address.routes.js
const express = require('express');
const router = express.Router();
const { 
    getMyAddresses, 
    addAddress,
    setDefaultAddress,
    deleteAddress 
} = require('../controllers/address.controller');
const { protect } = require('../middleware/auth.middleware');

// Bảo vệ tất cả các route
router.use(protect);

router.route('/')
    .get(getMyAddresses) // Lấy tất cả địa chỉ
    .post(addAddress);   // Thêm địa chỉ mới

router.put('/default/:id', setDefaultAddress); // Đặt làm mặc định
router.delete('/:id', deleteAddress);          // Xóa địa chỉ

module.exports = router;