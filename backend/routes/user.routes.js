// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');


const {
    getAllUsers,       // <-- MỚI
    updateUserByAdmin,
    updateMyProfile,  // <-- MỚI
} = require('../controllers/user.controller');
// 1. Import thêm middleware
const { protect, isAdmin } = require('../middleware/auth.middleware');
// POST /api/users/register
router.post('/register', userController.registerUser);

// POST /api/users/login (TÍNH NĂNG MỚI)
router.post('/login', userController.loginUser);
router.put('/profile', protect, updateMyProfile);

// --- Admin Routes ---
// 2. Lấy danh sách user (Admin)
router.get('/', protect, isAdmin, getAllUsers);

// 3. Cập nhật user bởi Admin
router.put('/:id/admin', protect, isAdmin, updateUserByAdmin);
module.exports = router;