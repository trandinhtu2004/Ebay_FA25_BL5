// routes/review.routes.js
const express = require('express');
const router = express.Router();
const { createReview, getProductReviews } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

// Thêm đánh giá (cần đăng nhập)
router.post('/', protect, createReview);

// Lấy đánh giá của sản phẩm (public)
router.get('/:productId', getProductReviews);

module.exports = router;