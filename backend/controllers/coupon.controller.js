// controllers/coupon.controller.js
const Coupon = require('../models/Coupon.model');
const Cart = require('../models/Cart.model');

// @desc    Tạo coupon mới (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res) => {
    // Lấy thông tin từ body
    const { code, discountPercent, startDate, endDate, maxUsage, productId, minOrderAmount } = req.body;

    try {
        const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
        if (couponExists) {
            return res.status(400).json({ message: 'Mã coupon này đã tồn tại.' });
        }

        const coupon = new Coupon({
            code: code.toUpperCase(),
            discountPercent,
            startDate,
            endDate,
            maxUsage,
            productId,
            minOrderAmount
        });

        const createdCoupon = await coupon.save();
        res.status(201).json(createdCoupon);

    } catch (error) {
        console.error("Lỗi tạo coupon:", error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// @desc    Xác thực coupon và tính toán giảm giá (Buyer)
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res) => {
    const { code } = req.body;
    const userId = req.user._id;

    if (!code) {
        return res.status(400).json({ message: 'Vui lòng nhập mã coupon.' });
    }

    try {
        // 1. Tìm coupon
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Mã coupon không hợp lệ hoặc đã bị vô hiệu hóa.' });
        }
        //kiểm tra user đã sử dụng coupon chưa
        const userOrdersWithCoupon = await Order.find({ user: userId, couponApplied: coupon.code });
        
        if (userOrdersWithCoupon.length > 0) {
            return res.status(400).json({ message: 'Bạn đã sử dụng mã coupon này trước đó.' });
        }

        // 2. Kiểm tra ngày hiệu lực
        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
            return res.status(400).json({ message: 'Mã coupon đã hết hạn hoặc chưa có hiệu lực.' });
        }

        // 3. Kiểm tra số lượt sử dụng
        if (coupon.timesUsed >= coupon.maxUsage) {
            return res.status(400).json({ message: 'Mã coupon đã hết lượt sử dụng.' });
        }

        // 4. Lấy giỏ hàng của user để tính toán
        const cart = await Cart.findOne({ user: userId }).populate('items.product', 'price');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Giỏ hàng trống.' });
        }
        
        // 5. Tính tổng tiền hàng (chưa giảm giá)
        let cartTotal = cart.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

        // 6. Kiểm tra giá trị đơn hàng tối thiểu
        if (cartTotal < coupon.minOrderAmount) {
            return res.status(400).json({ message: `Đơn hàng tối thiểu ${coupon.minOrderAmount}$ để áp dụng mã này.` });
        }
        
        // 7. Tính toán giảm giá
        let discountAmount = (cartTotal * coupon.discountPercent) / 100;
        
        // (Nếu có productId, logic tính discount sẽ phức tạp hơn - tạm thời bỏ qua)

        res.status(200).json({
            message: 'Áp dụng coupon thành công!',
            code: coupon.code,
            discountAmount: discountAmount,
            newTotal: cartTotal - discountAmount
        });

    } catch (error) {
        console.error("Lỗi xác thực coupon:", error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};