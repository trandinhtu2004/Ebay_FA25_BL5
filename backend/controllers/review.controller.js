// backend/controllers/review.controller.js

// --- SỬA ĐỔI PHẦN IMPORT (Dùng cách đơn giản) ---
// Cách này sẽ hoạt động 100% nếu file model của bạn dùng "module.exports"
const Review = require('../models/Review.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
// --- KẾT THÚC SỬA ĐỔI ---

// @desc    Thêm đánh giá mới
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
    const { productId, orderId, rating, comment } = req.body;
    const reviewerId = req.user._id;
    const reviews = await Review.find({ product: productId });

    try {
        // 1. Kiểm tra xem người này có mua sản phẩm này không?
        const order = await Order.findOne({
            _id: orderId,
            buyer: reviewerId,
            'orderItems.product': productId
        });
        
        if (!order) {
            return res.status(403).json({ message: 'Bạn phải mua sản phẩm này để đánh giá.' });
        }
        
        // (Kiểm tra đơn hàng đã giao - bạn đã thêm logic này)
        // Lưu ý: Chúng ta nên cho phép đánh giá cả đơn "shipped" và "delivered"
        if (order.status !== 'shipped' && order.status !== 'delivered') {
            return res.status(400).json({ message: 'Bạn chỉ có thể đánh giá đơn hàng đã giao.' });
        }

        // 2. Kiểm tra xem họ đã đánh giá sản phẩm này chưa
        // DÒNG NÀY SẼ HẾT LỖI
        const existingReview = await Review.findOne({ product: productId, reviewer: reviewerId });
        if (existingReview) {
            return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi.' });
        }
        
        // 3. Tạo đánh giá
        const review = new Review({
            product: productId,
            order: orderId,
            reviewer: reviewerId,
            rating: Number(rating),
            comment
        });
        const numReviews = reviews.length;
        const averageRating = numReviews > 0
            ? reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews
            : 0;
            
        // 4.3. Cập nhật vào Product document
        await Product.findByIdAndUpdate(productId, {
            rating: averageRating,
            numReviews: numReviews
        });

        await review.save();
        
        // 4. (Quan trọng) Cập nhật điểm trung bình trên Product model
        // (Chúng ta sẽ làm việc này ngay sau khi fix lỗi)
        
        res.status(201).json({ message: 'Gửi đánh giá thành công.' });
        
    } catch (error) {
        console.error('Lỗi khi tạo đánh giá:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi.' });
        }
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// @desc    Lấy tất cả đánh giá của 1 sản phẩm
// @route   GET /api/reviews/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('reviewer', 'username') // Lấy username của người đánh giá
            .sort({ createdAt: -1 });
            
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Lỗi khi lấy đánh giá:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};