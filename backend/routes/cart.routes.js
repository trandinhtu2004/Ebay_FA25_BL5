// routes/cart.routes.js
const express = require('express');
const router = express.Router();
const { getCart, 
    addToCart,
    updateCartItemQuantity, // <-- MỚI
    removeCartItem } = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

// Áp dụng middleware 'protect' cho tất cả các route trong file này
// Chỉ người dùng đã đăng nhập mới được truy cập giỏ hàng
router.use(protect);

router.route('/')
    .get(getCart)       // Lấy giỏ hàng
    .post(addToCart);   // Thêm vào giỏ hàng

// PUT /api/cart/item (Cập nhật số lượng)
router.put('/item', updateCartItemQuantity);

// DELETE /api/cart/item (Xóa sản phẩm)
router.delete('/item', removeCartItem);

// (Chúng ta sẽ thêm route DELETE để xóa sản phẩm sau)

module.exports = router;