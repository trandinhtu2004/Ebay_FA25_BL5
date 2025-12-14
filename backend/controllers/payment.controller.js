// controllers/payment.controller.js
const Order = require('../models/Order.model');

// @desc    Giả lập tạo URL thanh toán VNPay
// @route   POST /api/payment/vnpay
// @access  Private
exports.createVNPayPayment = async (req, res) => {
    const { orderId } = req.body;
    
    try {
        const order = await Order.findById(orderId);
        if (!order || order.buyer.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }
        
        // 🔐 Kiểm tra Auth token (đã làm bằng middleware 'protect')
        
        // Tạo một URL giả lập. URL này sẽ trỏ về "cổng" callback của chính chúng ta
        // Chúng ta giả lập 2 kịch bản: thành công (90%) và thất bại (10%)
        const isSuccess = Math.random() < 0.9; // Giả lập 90% thành công
        const vnp_TransactionStatus = isSuccess ? '00' : '02'; // '00' = Success, '02' = Failed
        
        const returnUrl = `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/payment/vnpay_return?orderId=${orderId}&vnp_TransactionStatus=${vnp_TransactionStatus}&vnp_TxnRef=${orderId}&vnp_Amount=${order.totalPrice * 100}`;
        
        // ⚡ Tốc độ xác nhận (giả lập): Trả về ngay lập tức
        res.status(200).json({ paymentUrl: returnUrl });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// @desc    Giả lập VNPay gọi về (Return URL)
// @route   GET /api/payment/vnpay_return
// @access  Public (Vì VNPay gọi về)
exports.handleVNPayReturn = async (req, res) => {
    const { orderId, vnp_TransactionStatus } = req.query;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-failed?message=OrderNotFound`);
        }
        
        // 🐞 Log chi tiết transaction
        console.log(`[VNPay Return] OrderID: ${orderId}, Status: ${vnp_TransactionStatus}`);

        if (vnp_TransactionStatus === '00') { // Thanh toán THÀNH CÔNG
            
            order.status = 'pending_confirmation'; // Chuyển sang chờ người bán xác nhận
            order.paymentResult = {
                id: req.query.vnp_TxnRef,
                status: 'paid',
                update_time: new Date().toISOString()
            };
            order.paidAt = new Date();
            await order.save();
            
            // Gửi email xác nhận (sẽ làm ở bước sau) [cite: 61]
            
            // Chuyển hướng user về trang thành công
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success/${orderId}`);

        } else { // Thanh toán THẤT BẠI
            order.status = 'pending_payment'; // Vẫn là chờ thanh toán
            await order.save();
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-failed?orderId=${orderId}&message=PaymentFailed`);
        }
        
    } catch (error) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-failed?message=ServerError`);
    }
};