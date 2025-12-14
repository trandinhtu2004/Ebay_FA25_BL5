// controllers/order.controller.js
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const Cart = require('../models/Cart.model');
const Address = require('../models/Address.model');
const Coupon = require('../models/Coupon.model');
const mongoose = require('mongoose');
const { createNotificationInternal } = require('./notification.controller');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Logged-in users only)
// @desc    Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
    // Lấy thông tin cần thiết từ request body và user đã xác thực
    const { addressId, paymentMethod, couponCode } = req.body;
    const userId = req.user._id; // ID của người mua (Buyer)

    // Log thông tin ban đầu nhận được
    console.log(`[Create Order] User ${userId} đang tạo đơn hàng. Address ID: ${addressId}, Phương thức: ${paymentMethod}, Coupon: ${couponCode || 'None'}.`);

    try {
        // --- 1. Lấy Giỏ hàng và Địa chỉ ---
        // Lấy giỏ hàng, populate thông tin sản phẩm và thông tin người bán của sản phẩm đó
        const cart = await Cart.findOne({ user: userId }).populate({
            path: 'items.product', // Populate các sản phẩm trong giỏ
            select: 'title price images stock seller', // Chọn các trường cần thiết từ Product
            populate: { path: 'seller', select: '_id username' } // Populate người bán từ Product
        });
        // Lấy địa chỉ giao hàng
        const address = await Address.findById(addressId);

        // --- 2. Validate Giỏ hàng và Địa chỉ ---
        if (!cart || cart.items.length === 0) {
            console.error(`[Create Order] Lỗi Validation cho User ${userId}: Giỏ hàng trống.`);
            return res.status(400).json({ message: 'Giỏ hàng của bạn đang trống.' });
        }
        // Kiểm tra địa chỉ có tồn tại và thuộc về user đang đặt hàng không
        if (!address || address.user.toString() !== userId.toString()) {
            console.error(`[Create Order] Lỗi Validation cho User ${userId}: Địa chỉ ID ${addressId} không hợp lệ hoặc không tìm thấy.`);
            return res.status(400).json({ message: 'Địa chỉ giao hàng không hợp lệ.' });
        }
        // Kiểm tra xem địa chỉ có đủ các trường bắt buộc không
        if (!address.fullName || !address.phone || !address.street || !address.city || !address.country) {
            console.error('[Create Order] Lỗi Validation: Địa chỉ lấy được không đầy đủ thông tin:', address);
            return res.status(400).json({ message: 'Thông tin địa chỉ giao hàng bị thiếu. Vui lòng kiểm tra lại.' });
        }

        // --- 3. Xử lý Các Mục trong Giỏ hàng ---
        const orderItems = []; // Mảng chứa các sản phẩm sẽ lưu vào đơn hàng
        let itemsPrice = 0; // Tổng tiền hàng (chưa tính ship, chưa giảm giá)
        const uniqueSellerIds = new Set(); // Set để lưu ID các người bán duy nhất liên quan

        console.log(`[Create Order] Đang xử lý ${cart.items.length} sản phẩm trong giỏ hàng...`);
        for (const item of cart.items) {
            const product = item.product; // Thông tin sản phẩm đã được populate

            // Kiểm tra kỹ sản phẩm có tồn tại không (phòng trường hợp DB không nhất quán)
            if (!product) {
                console.error(`[Create Order] Lỗi nghiêm trọng: Sản phẩm ID ${item.product?._id || 'unknown'} trong giỏ hàng không thể populate.`);
                throw new Error(`Một sản phẩm trong giỏ hàng không hợp lệ.`);
            }

            // Kiểm tra tồn kho
            if (product.stock < item.quantity) {
                console.error(`[Create Order] Lỗi Tồn kho: Sản phẩm "${product.title}" (${product._id}) cần ${item.quantity}, chỉ còn ${product.stock}.`);
                throw new Error(`Sản phẩm "${product.title}" không đủ tồn kho.`);
            }

            // Trừ tồn kho sản phẩm
            product.stock -= item.quantity;
            await product.save(); // Lưu lại số lượng tồn kho mới

            // Tạo đối tượng item cho đơn hàng
            orderItems.push({
                title: product.title,
                quantity: item.quantity,
                price: product.price,
                image: product.images[0] || 'default_image_url.jpg', // Lấy ảnh đầu tiên hoặc ảnh mặc định
                product: product._id // Lưu ID tham chiếu đến sản phẩm gốc
                // seller: product.seller?._id // Có thể thêm nếu cần lưu seller cho từng item
            });

            // Thu thập ID người bán (nếu có) để gửi thông báo
            if (product.seller?._id) {
                uniqueSellerIds.add(product.seller._id.toString());
            } else {
                // Cảnh báo nếu sản phẩm không có người bán
                console.warn(`[Create Order] Cảnh báo: Sản phẩm ${product._id} ('${product.title}') không có thông tin người bán.`);
            }

            // Cộng dồn tiền hàng
            itemsPrice += product.price * item.quantity;
        }
        console.log(`[Create Order] Xử lý sản phẩm hoàn tất. Tổng tiền hàng: ${itemsPrice}. Các Seller liên quan: ${Array.from(uniqueSellerIds).join(', ')}`);

        // --- 4. Validate và Áp dụng Coupon (Nếu có) ---
        let discountAmount = 0; // Số tiền được giảm giá
        let finalCoupon = null; // Lưu lại thông tin coupon hợp lệ đã áp dụng
        if (couponCode) {
            console.log(`[Create Order] Đang xác thực coupon: ${couponCode}`);
            finalCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
            const now = new Date();

            // Kiểm tra các điều kiện của coupon
            if (finalCoupon &&
                now >= finalCoupon.startDate &&
                now <= finalCoupon.endDate &&
                finalCoupon.timesUsed < finalCoupon.maxUsage &&
                itemsPrice >= finalCoupon.minOrderAmount)
            {
                // Tính số tiền giảm giá
                discountAmount = (itemsPrice * finalCoupon.discountPercent) / 100;
                console.log(`[Create Order] Coupon ${couponCode} hợp lệ. Giảm giá: ${discountAmount}`);
            } else {
                // Xác định lý do coupon không hợp lệ
                let couponErrorMsg = 'Mã coupon không hợp lệ hoặc không thể áp dụng.';
                if(finalCoupon && itemsPrice < finalCoupon.minOrderAmount) couponErrorMsg = `Đơn hàng tối thiểu ${finalCoupon.minOrderAmount}$ để dùng coupon này.`
                else if (finalCoupon && (now < finalCoupon.startDate || now > finalCoupon.endDate)) couponErrorMsg = 'Coupon đã hết hạn hoặc chưa có hiệu lực.'
                else if (finalCoupon && finalCoupon.timesUsed >= finalCoupon.maxUsage) couponErrorMsg = 'Coupon đã hết lượt sử dụng.'
                else if (!finalCoupon) couponErrorMsg = 'Mã coupon không tồn tại hoặc đã bị vô hiệu hóa.';

                console.error(`[Create Order] Xác thực coupon ${couponCode} thất bại. Lý do: ${couponErrorMsg}`);
                return res.status(400).json({ message: couponErrorMsg });
            }
        }

        // --- 5. Tính toán Giá cuối cùng ---
        const shippingPrice = 0.0; // Placeholder - Cần logic tính phí vận chuyển thực tế
        const totalPrice = itemsPrice - discountAmount + shippingPrice; // Tổng tiền cuối cùng
        console.log(`[Create Order] Tính toán giá cuối cùng: Phí Ship: ${shippingPrice}, Tổng cộng: ${totalPrice}`);

        // --- 6. Xác định Trạng thái Ban đầu ---
        // Nếu là COD, chờ người bán xác nhận. Nếu thanh toán online, chờ thanh toán.
        const initialStatus = (paymentMethod === 'COD') ? 'pending_confirmation' : 'pending_payment';

        // --- 7. Tạo Document Đơn hàng mới ---
        const order = new Order({
            buyer: userId,
            orderItems: orderItems,
            shippingAddress: { // Nhúng thông tin địa chỉ vào đơn hàng
                fullName: address.fullName,
                phone: address.phone,
                street: address.street,
                city: address.city,
                country: address.country
            },
            paymentMethod: paymentMethod,
            itemsPrice: itemsPrice, // Tổng tiền hàng gốc
            shippingPrice: shippingPrice,
            totalPrice: totalPrice, // Tổng tiền cuối cùng
            status: initialStatus, // Trạng thái ban đầu
            couponApplied: finalCoupon ? finalCoupon.code : null // Lưu mã coupon đã dùng (nếu có)
            // sellersInvolved: Array.from(uniqueSellerIds) // Tùy chọn: Lưu danh sách seller ID
        });

        // Lưu đơn hàng vào database
        const createdOrder = await order.save();
        console.log(`[Create Order] Đã lưu thành công Order ID: ${createdOrder._id}.`);

        // --- 8. Cập nhật Số lần sử dụng Coupon (Nếu có) ---
        if (finalCoupon) {
            finalCoupon.timesUsed += 1; // Tăng số lần đã dùng
            await finalCoupon.save();
            console.log(`[Create Order] Đã cập nhật số lần sử dụng cho coupon ${finalCoupon.code}.`);
        }

        // --- 9. Xóa Giỏ hàng của Người mua ---
        await Cart.findOneAndUpdate({ user: userId }, { items: [] }); // Đặt mảng items thành rỗng
        console.log(`[Create Order] Đã xóa giỏ hàng cho user ${userId}.`);

        // --- 10. Gửi Thông báo Real-time ---
        console.log('[Create Order] Đang gửi thông báo...');
        // Gửi thông báo cho Người mua (Buyer)
        const buyerMessage = `Đơn hàng #${createdOrder._id.toString().substring(0, 6)} đã được đặt thành công!`;
        const buyerLink = `/orders/${createdOrder._id}`;
        await createNotificationInternal(userId.toString(), buyerMessage, buyerLink); // Gọi không cần req

        for (const sellerId of uniqueSellerIds) {
            const sellerMessage = `Bạn có đơn hàng mới #${createdOrder._id.toString().substring(0, 6)} từ ${req.user.username || 'Buyer'}.`;
            const sellerLink = `/dashboard/orders`;
            await createNotificationInternal(sellerId, sellerMessage, sellerLink); // Gọi không cần req
        }
        console.log('[Create Order] Gửi thông báo hoàn tất.');
        // ------------------------------------

        // --- 11. Trả về Đơn hàng đã tạo cho Frontend ---
        res.status(201).json(createdOrder);

    } catch (error) {
        // Xử lý các lỗi có thể xảy ra (hết hàng, lỗi DB, lỗi coupon...)
        console.error('[Create Order] LỖI NGHIÊM TRỌNG trong quá trình tạo đơn hàng:', error);
        // Trả về thông báo lỗi cụ thể nếu có (ví dụ: lỗi tồn kho)
        res.status(400).json({ message: error.message || 'Không thể tạo đơn hàng. Đã xảy ra lỗi không mong muốn.' });
    }
};

// @desc    Get order history for the logged-in user
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching user order history:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy lịch sử đơn hàng.' });
    }
};


// @desc    Get details of a specific order
// @route   GET /api/orders/:id
// @access  Private (Buyer owns order OR user is Admin)
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('orderItems.product', 'images title') // Populate basic product info if needed
            .populate('buyer', 'username email'); // Populate basic buyer info

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }

        // Authorization check: Allow buyer or admin
        if (order.buyer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            console.warn(`[Get Order] Forbidden attempt by user ${req.user._id} (role: ${req.user.role}) to access order ${req.params.id} owned by ${order.buyer._id}`);
            return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này.' });
        }

        res.status(200).json(order);

    } catch (error) {
        console.error(`Error fetching order details for ID ${req.params.id}:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết đơn hàng.' });
    }
};

// @desc    Get orders relevant to the logged-in seller
// @route   GET /api/orders/seller/all
// @access  Private/Seller
exports.getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.user._id;

        // Find product IDs owned by this seller
        const sellerProducts = await Product.find({ seller: sellerId }).select('_id');
        const sellerProductIds = sellerProducts.map(p => p._id);

        if (sellerProductIds.length === 0) {
            return res.status(200).json([]); // Return empty array if seller has no products
        }

        // Find orders containing any of the seller's product IDs
        const orders = await Order.find({ 'orderItems.product': { $in: sellerProductIds } })
            .populate('buyer', 'username email') // Get buyer info
            .sort({ createdAt: -1 });

        // Optional: Filter orderItems in each order to ONLY show items by this seller
        // This can be complex and might be better handled on the frontend if needed.
        // For now, return the full order if it contains at least one item from the seller.

        res.status(200).json(orders);
    } catch (error) {
        console.error(`Error fetching orders for seller ${req.user._id}:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy đơn hàng của người bán.' });
    }
};

// // === HÀM MỚI 2 ===
// // @desc    Cập nhật trạng thái đơn hàng (Seller)
// // @route   PUT /api/orders/seller/:id/status
// // @access  Private/Seller
// exports.updateOrderStatus = async (req, res) => {
//     const { status } = req.body; // Trạng thái mới, vd: "processing", "shipped"
//     const orderId = req.params.id;
//     const sellerId = req.user._id;

//     // Các trạng thái mà seller có thể set
//     const allowedStatusUpdates = ['processing', 'shipped', 'cancelled'];
//     if (!allowedStatusUpdates.includes(status)) {
//         return res.status(400).json({ message: 'Trạng thái cập nhật không hợp lệ.' });
//     }

//     try {
//         const order = await Order.findById(orderId);
//         if (!order) {
//             return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
//         }

//         // TODO: Kiểm tra xem seller có quyền cập nhật đơn hàng này không
//         // (Logic này phức tạp hơn, tạm thời seller có thể cập nhật)
//         // (Cách làm đúng: kiểm tra xem đơn hàng có SP của seller không)

//         order.status = status;
        
//         // Nếu giao hàng thành công/thất bại (cập nhật trạng thái)
//         if (status === 'shipped') {
//             // (Tạm thời chỉ cập nhật status)
//         }
//         // (Chúng ta sẽ thêm logic 'deliveredAt' sau)
//         const oldStatus = order.status;
//         const updatedOrder = await order.save();
//         // --- 2. GỬI THÔNG BÁO CHO BUYER ---
//         if (oldStatus !== status) { // Chỉ gửi nếu trạng thái thực sự thay đổi
//             const message = `Đơn hàng #${orderId.substring(0,6)} của bạn đã được cập nhật trạng thái thành: ${status}.`;
//             let link = `/orders/${order._id}`;
//             // Gửi thông báo đến người mua (order.buyer)
//             await createNotificationInternal(order.buyer.toString(), message, `/orders/${orderId}`, req);
//         }
//         // Gửi email khi trạng thái thay đổi (sẽ làm ở Nhóm 4)

//         res.status(200).json(updatedOrder);
//     } catch (error) {
//         console.error('Lỗi cập nhật trạng thái:', error);
//         res.status(500).json({ message: 'Lỗi máy chủ.' });
//     }
// };

exports.getAllOrdersAdmin = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('buyer', 'username email')
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Lỗi lấy đơn hàng admin:", error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// @desc    Update order status (by Seller or Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/SellerOrAdmin
exports.updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log(`[Update Status] User ${userId} (Role: ${userRole}) attempting to update order ${orderId} to status: ${status}.`);

    // Define allowed statuses based on role (Admin has more power)
    const allowedAdminUpdates = ['processing', 'shipped', 'delivered', 'cancelled', 'pending_confirmation', 'pending_payment'];
    const allowedSellerUpdates = ['processing', 'shipped', 'cancelled']; // Sellers typically can't mark as delivered or revert payment status

    const allowedUpdates = (userRole === 'admin') ? allowedAdminUpdates : allowedSellerUpdates;

    if (!status || !allowedUpdates.includes(status)) {
         console.warn(`[Update Status] Invalid status update attempt by ${userId}. Status: ${status}. Allowed: ${allowedUpdates.join(', ')}`);
        return res.status(400).json({ message: `Trạng thái cập nhật "${status}" không hợp lệ cho vai trò của bạn.` });
    }

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            console.error(`[Update Status] Order ${orderId} not found.`);
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }

        // --- Authorization Check (More granular) ---
        if (userRole !== 'admin' || userRole !== 'seller') {
            // If not admin, must be a seller, check if they own items in this order
            const sellerProductIds = await Product.find({ seller: userId }).distinct('_id');
            const orderHasSellerProduct = order.orderItems.some(item =>
                sellerProductIds.some(sellerProdId => sellerProdId.equals(item.product))
            );
            if (!orderHasSellerProduct) {
                console.warn(`[Update Status] Forbidden: Seller ${userId} attempted to update order ${orderId} they have no items in.`);
                return res.status(403).json({ message: 'Bạn không có quyền cập nhật đơn hàng này.' });
            }
        }
        // --- End Authorization Check ---

        const oldStatus = order.status;
        if (oldStatus === status) return res.status(200).json(order); // Không thay đổi

        order.status = status;
        if (status === 'delivered' && !order.deliveredAt) { order.deliveredAt = new Date(); }
        
        const updatedOrder = await order.save();
        console.log(`[Update Status] Đã cập nhật Order ${orderId} thành ${status}.`);

        // --- GỬI THÔNG BÁO (Đã sửa: không cần 'req') ---
       if (oldStatus !== status) {
            console.log(`[Update Status] Đang gửi thông báo cho buyer ${order.buyer.toString()}...`);
            const message = `Trạng thái đơn hàng #${orderId.substring(0, 6)} đã cập nhật thành: ${status}.`;
            const link = `/orders/${order._id}`;
            await createNotificationInternal(order.buyer.toString(), message, link); // Gọi không cần req
        }
        // ------------------------------------------

        // Optionally send notification to relevant sellers if updated by Admin (complex logic needed)

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error(`[Update Status] Error updating order ${orderId} to ${status}:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật trạng thái đơn hàng.' });
    }
};