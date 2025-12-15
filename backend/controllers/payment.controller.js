// controllers/payment.controller.js
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const Coupon = require('../models/Coupon.model');
const axios = require('axios');
const crypto = require("crypto");
const Cart = require('../models/Cart.model');
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


const accessKey = process.env.MOMO_ACCESS_KEY;
const secretKey = process.env.MOMO_SECRET_KEY;
const partnerCode = process.env.MOMO_PARTNER_CODE;
const MOMO_API_ENDPOINT = process.env.MOMO_API_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";
const IPN_URL = process.env.MOMO_IPN_URL; 
const REDIRECT_URL = process.env.MOMO_REDIRECT_URL;
const EXCHANGE_RATE = 25000;
exports.createMomoPayment = async (req, res) => {
  // ⚙️ 1. Lấy và kiểm tra dữ liệu đầu vào (Giữ nguyên)
  const { 
    shippingAddress, 
    orderItems, 
    couponCode, 
    shippingPrice = 0 
  } = req.body;
  const userId = req.user._id;

  if (!userId || !shippingAddress || !orderItems || orderItems.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Thiếu thông tin người mua, địa chỉ, hoặc giỏ hàng trống." });
  }
  
  // Kiểm tra cấu hình bắt buộc (Giữ nguyên)
  if (!accessKey || !secretKey || !partnerCode || !IPN_URL || !REDIRECT_URL) {
    console.error("Thiếu cấu hình MoMo trong biến môi trường.");
    return res.status(500).json({ success: false, message: "Lỗi cấu hình thanh toán MoMo." });
  }

  // --- Bắt đầu logic xử lý Order ---
  let itemsPrice_USD = 0; // Tính toán bằng USD
  let appliedCoupon = null;
  let order = null;

  try {
    // ⚙️ 2. Tính toán & Xác thực giá trị đơn hàng từ DB (Vẫn tính bằng USD)
    for (const item of orderItems) {
      const productDB = await Product.findById(item.product);
      if (!productDB || productDB.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Sản phẩm "${item.title}" không tồn tại hoặc đã hết hàng.` 
        });
      }
      // Sử dụng giá trong DB (giả định là USD) cho tính toán tổng tiền
      itemsPrice_USD += productDB.price * item.quantity;
    }

    let totalPrice_USD = itemsPrice_USD + shippingPrice;
    
    // ⚙️ 3. Áp dụng Coupon (nếu có) - (Vẫn áp dụng trên USD)
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      
      if (coupon) {
        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate || coupon.timesUsed >= coupon.maxUsage || itemsPrice_USD < coupon.minOrderAmount) {
          return res.status(400).json({ success: false, message: "Mã giảm giá không hợp lệ hoặc không đủ điều kiện." });
        }
        
        const discountAmount_USD = itemsPrice_USD * (coupon.discountPercent / 100);
        totalPrice_USD = totalPrice_USD - discountAmount_USD;
        
        appliedCoupon = { 
          id: coupon._id, 
          code: coupon.code, 
          discountAmount_USD 
        };
    }
    }

        // =========================================================
        // 🚀 BƯỚC 4: CHUYỂN ĐỔI TỪ USD SANG VNĐ VÀ LÀM TRÒN
        // =========================================================
        
        let amount_VND = Math.round(totalPrice_USD * EXCHANGE_RATE);

        // Đảm bảo tổng tiền thanh toán không nhỏ hơn 1000 VNĐ (giới hạn tối thiểu của MoMo)
        amount_VND = Math.max(1000, amount_VND);
        const amount = amount_VND; 

    // ⚙️ 5. Chuẩn bị MoMo Request Parameters
    const orderInfo = `Thanh toán đơn hàng cho Buyer ID: ${userId} - Tổng tiền: ${amount.toLocaleString()} VNĐ`;
    const requestType = "captureWallet";
    const orderId = partnerCode + new Date().getTime(); // MoMo's Order ID
    const requestId = orderId;

    // ⚙️ 6. Tạo đơn hàng tạm thời (status: 'pending_payment')
    order = await Order.create({
      buyer: userId,
      shippingAddress: shippingAddress,
      orderItems: orderItems.map(item => ({ 
        ...item, 
        product: item.product // ID sản phẩm
      })),
      paymentMethod: 'momo', // Đảm bảo dùng chữ thường cho Enum
      itemsPrice: itemsPrice_USD, // Lưu giá trị gốc bằng USD
      shippingPrice: shippingPrice, // Lưu giá trị gốc bằng USD
      totalPrice: totalPrice_USD, // Lưu tổng tiền gốc bằng USD
      totalPriceVND: amount, // LƯU GIÁ TRỊ VNĐ THỰC TẾ ĐỂ ĐỐI CHIẾU
      status: 'pending_payment',
    });
        
        // ⚙️ 6. Encode extraData (gửi kèm để callback đọc lại)
        const extraData = Buffer.from(
            JSON.stringify({
                localOrderId: order._id.toString(), // ID MongoDB
                buyerId: userId.toString(),
            })
        ).toString("base64");
        
        // ⚙️ 7. Ký dữ liệu (signature)
        const rawSignature =
            `accessKey=${accessKey}` +
            `&amount=${amount}` +
            `&extraData=${extraData}` +
            `&ipnUrl=${IPN_URL}` +
            `&orderId=${orderId}` +
            `&orderInfo=${orderInfo}` +
            `&partnerCode=${partnerCode}` +
            `&redirectUrl=${REDIRECT_URL}` +
            `&requestId=${requestId}` +
            `&requestType=${requestType}`;

        const signature = crypto
            .createHmac("sha256", secretKey)
            .update(rawSignature)
            .digest("hex");

        const requestBody = {
            partnerCode,
            requestId,
            amount: amount, 
            orderId,
            orderInfo,
            redirectUrl: REDIRECT_URL,
            ipnUrl: IPN_URL,
            lang: "vi",
            requestType,
            autoCapture: true,
            extraData,
            signature,
        };

        // ⚙️ 8. Gọi API MoMo 
        const result = await axios.post(
            MOMO_API_ENDPOINT,
            requestBody,
            { headers: { "Content-Type": "application/json" } }
        );

        // ⚙️ 9. Cập nhật order_id của MoMo vào đơn hàng MongoDB & Coupon
        await Order.findByIdAndUpdate(order._id, { 
            momoOrderId: orderId, // Lưu ID MoMo
            paymentResult: { 
                id: orderId, 
                status: 'pending' 
            }
        });
        
        if (appliedCoupon) {
            await Coupon.findByIdAndUpdate(appliedCoupon.id, { $inc: { timesUsed: 1 } });
        }

        // ⚙️ 10. Trả về payUrl cho Frontend
        return res.status(200).json({
            success: true,
            message: "Khởi tạo thanh toán MoMo thành công",
            payUrl: result.data.payUrl, // URL chuyển hướng sang MoMo
            localOrderId: order._id,
            momoResponse: result.data,
        });

    } catch (error) {
        console.error("❌ MoMo payment init failed:", error.response?.data || error.message);
        
        // ❌ Xử lý rollback nếu lỗi (xóa order, hoàn lại coupon usage)
        if (order && order._id) {
            await Order.findByIdAndDelete(order._id); 
        }
        
        if (appliedCoupon) {
            await Coupon.findByIdAndUpdate(appliedCoupon.id, { $inc: { timesUsed: -1 } });
        }

        return res.status(500).json({
            success: false,
            message: "Không thể khởi tạo thanh toán MoMo",
            error: error.response?.data || error.message,
        });
    }
};
exports.returnData = async (req, res) => {
  // Nhận payload từ Frontend (chứa các query params và isFromCart)
  const momoRes = req.body; 
  const { isFromCart, localOrderId, resultCode, transId } = momoRes;
    const buyerId = req.user._id;

  console.log(`✅ MoMo Return processing initiated. Order ID: ${localOrderId}, From Cart: ${isFromCart}`);

  if (!localOrderId) {
    return res.status(400).json({ success: false, message: 'Missing Order ID.' });
  }

  const isMomoSuccess = resultCode === "0";
  const newOrderStatus = isMomoSuccess ? 'pending_confirmation' : 'cancelled';

  try {
    const order = await Order.findById(localOrderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
        
        // Tránh xử lý trùng lặp
        if (order.status !== 'pending_payment') {
            return res.status(200).json({ 
                success: true, 
                message: "Order already processed.",
                orderId: order._id
            });
        }

    // 1. Cập nhật Order chính
    order.status = newOrderStatus;
    order.paidAt = isMomoSuccess ? new Date() : undefined;
    order.paymentResult = {
      id: transId || momoRes.orderId,
      status: isMomoSuccess ? 'paid' : 'failed',
      update_time: new Date().toISOString(),
    };

    // 2. Xử lý tồn kho (Chỉ khi thanh toán THÀNH CÔNG)
    if (isMomoSuccess) {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock = product.stock - item.quantity; 
          await product.save();
        } 
      }

      // 3. DỌN DẸP CART DB (Sử dụng biến isFromCart từ Frontend)
      if (isFromCart) {
        const cart = await Cart.findOne({ user: buyerId });
        console.log(`🧹 Cleaning up cart for user ${buyerId}.`);
        if (cart) {
          const purchasedProductIds = order.orderItems.map(item => item.product.toString());
          
          cart.items = cart.items.filter(item => 
            !purchasedProductIds.includes(item.product.toString())
          );
          
          await cart.save();
          console.log(`🗑️ Cart cleaned up for user ${buyerId}.`);
        }
      }
    }

    await order.save(); // Lưu order với trạng thái cuối cùng
    


    return res.status(200).json({
      success: true,
      message: "Order processed successfully",
      orderId: order._id,
    });

  } catch (err) {
    console.error("❌ MoMo Return Processing Error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi xử lý đơn hàng sau thanh toán.",
    });
  }
};
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

