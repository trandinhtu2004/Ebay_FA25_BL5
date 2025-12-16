// controllers/coupon.controller.js
const Coupon = require('../models/Coupon.model');
const Cart = require('../models/Cart.model');
const Order = require('../models/Order.model');

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
    const { code, orderTotal } = req.body; // Thêm orderTotal để tính từ checkout
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
        const userOrdersWithCoupon = await Order.find({ buyer: userId, couponApplied: coupon.code });
        
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

        // 4. Tính tổng tiền hàng
        let cartTotal = 0;
        
        // Nếu có orderTotal từ checkout, dùng nó (ưu tiên)
        if (orderTotal && orderTotal > 0) {
            cartTotal = Number(orderTotal);
        } else {
            // Nếu không, lấy từ giỏ hàng
            const cart = await Cart.findOne({ user: userId }).populate('items.product', 'price');
            if (!cart || !cart.items || cart.items.length === 0) {
                return res.status(400).json({ message: 'Giỏ hàng trống hoặc không có thông tin đơn hàng.' });
            }
            cartTotal = cart.items.reduce((acc, item) => {
                if (item.product && item.product.price) {
                    return acc + (Number(item.product.price) * Number(item.quantity || 1));
                }
                return acc;
            }, 0);
        }
        
        if (cartTotal <= 0) {
            return res.status(400).json({ message: 'Tổng tiền đơn hàng không hợp lệ.' });
        }

        // 5. Kiểm tra giá trị đơn hàng tối thiểu
        if (cartTotal < coupon.minOrderAmount) {
            return res.status(400).json({ message: `Đơn hàng tối thiểu ${coupon.minOrderAmount}$ để áp dụng mã này.` });
        }
        
        // 6. Tính toán giảm giá
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
        // Trả về thông báo lỗi chi tiết hơn để debug
        const errorMessage = error.message || 'Lỗi máy chủ.';
        res.status(500).json({ 
            message: 'Lỗi máy chủ.',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
};

// @desc    Seed data mẫu cho coupon (Admin)
// @route   POST /api/coupons/seed
// @access  Private/Admin
exports.seedCoupons = async (req, res) => {
    try {
        const sampleCoupons = [
            {
                code: 'SALE20',
                discountPercent: 20,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
                maxUsage: 100,
                minOrderAmount: 50,
                isActive: true
            },
            {
                code: 'SUMMER50',
                discountPercent: 50,
                startDate: new Date(),
                endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 ngày
                maxUsage: 50,
                minOrderAmount: 100,
                isActive: true
            },
            {
                code: 'WELCOME10',
                discountPercent: 10,
                startDate: new Date(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 ngày
                maxUsage: 200,
                minOrderAmount: 20,
                isActive: true
            },
            {
                code: 'FLASH30',
                discountPercent: 30,
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
                maxUsage: 30,
                minOrderAmount: 75,
                isActive: true
            }
        ];

        const createdCoupons = [];
        for (const couponData of sampleCoupons) {
            const existing = await Coupon.findOne({ code: couponData.code });
            if (!existing) {
                const coupon = new Coupon(couponData);
                await coupon.save();
                createdCoupons.push(coupon);
            } else {
                createdCoupons.push(existing);
            }
        }

        res.status(201).json({
            message: 'Seed coupons thành công!',
            created: createdCoupons.length,
            coupons: createdCoupons
        });

    } catch (error) {
        console.error("Lỗi seed coupons:", error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};