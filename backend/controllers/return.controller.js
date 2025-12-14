// controllers/return.controller.js
const ReturnRequest = require('../models/ReturnRequest.model');
const Order = require('../models/Order.model');
const { createNotificationInternal } = require('./notification.controller');
// @desc    Tạo yêu cầu hoàn trả mới
// @route   POST /api/returns
// @access  Private
exports.createReturnRequest = async (req, res) => {
    const { orderId, productId, reason } = req.body;
    const userId = req.user._id;

    try {
        // 1. Kiểm tra xem user có phải chủ đơn hàng không
        const order = await Order.findOne({ _id: orderId, buyer: userId });
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc bạn không phải chủ đơn hàng.' });
        }

        // 2. (Kiểm tra xem đơn hàng đã giao chưa - tùy logic nghiệp vụ)
        // if (order.status !== 'delivered') {
        //     return res.status(400).json({ message: 'Chỉ có thể yêu cầu hoàn trả đơn hàng đã giao.' });
        // }

        // 3. Kiểm tra xem đã có yêu cầu cho đơn hàng/sản phẩm này chưa
        const existingRequest = await ReturnRequest.findOne({ order: orderId, user: userId, product: productId });
        if (existingRequest) {
            return res.status(400).json({ message: 'Bạn đã gửi yêu cầu hoàn trả cho sản phẩm/đơn hàng này.' });
        }

        // 4. Tạo yêu cầu mới
        const returnRequest = new ReturnRequest({
            order: orderId,
            user: userId,
            product: productId, // Có thể null nếu trả cả đơn
            reason
        });

        await returnRequest.save();
        res.status(201).json(returnRequest);

    } catch (error) {
        console.error('Lỗi tạo yêu cầu hoàn trả:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// @desc    Lấy lịch sử yêu cầu hoàn trả của user
// @route   GET /api/returns/myrequests
// @access  Private
exports.getMyReturnRequests = async (req, res) => {
    try {
        const requests = await ReturnRequest.find({ user: req.user._id })
            .populate('order', 'orderItems totalPrice') // Lấy thông tin cơ bản của đơn hàng
            .populate('product', 'title') // Lấy tên sản phẩm nếu có
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        console.error('Lỗi lấy lịch sử hoàn trả:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// === HÀM MỚI (Admin) ===
// @desc    Lấy tất cả yêu cầu hoàn trả (Admin, có thể lọc)
// @route   GET /api/returns/admin
// @access  Private/Admin
exports.getAllReturnRequests = async (req, res) => {
    try {
        // Lọc theo trạng thái nếu có query param ?status=pending
        const filter = req.query.status ? { status: req.query.status } : {};

        const requests = await ReturnRequest.find(filter)
            .populate('order', 'totalPrice') // Lấy ID đơn hàng và tổng tiền
            .populate('user', 'username email') // Lấy thông tin người yêu cầu
            .populate('product', 'title') // Lấy tên sản phẩm nếu có
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        console.error('Lỗi lấy yêu cầu hoàn trả (Admin):', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// === HÀM MỚI (Admin) ===
// @desc    Cập nhật trạng thái yêu cầu hoàn trả (Admin)
// @route   PUT /api/returns/admin/:id
// @access  Private/Admin
exports.updateReturnRequestStatus = async (req, res) => {
    const { status, resolutionNotes } = req.body; // Trạng thái mới và ghi chú giải quyết
    const requestId = req.params.id;

    const allowedStatuses = ['approved', 'rejected', 'processing', 'completed'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Trạng thái cập nhật không hợp lệ.' });
    }

    try {
        const returnRequest = await ReturnRequest.findById(requestId);
        if (!returnRequest) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu hoàn trả.' });
        }

        const oldStatus = returnRequest.status;
        returnRequest.status = status;
        if (resolutionNotes) {
            returnRequest.resolutionNotes = resolutionNotes;
        }

        const updatedRequest = await returnRequest.save();

        // TODO: Gửi thông báo cho người dùng về cập nhật trạng thái yêu cầu
        if (oldStatus !== status) {
           const message = `Yêu cầu hoàn trả cho đơn hàng #${returnRequest.order.toString().substring(0,6)} đã được cập nhật thành: ${status}.`;
           const link = `/return-history`; // Hoặc link chi tiết yêu cầu nếu có
           await createNotificationInternal(returnRequest.user.toString(), message, link, req);
        }

        res.status(200).json(updatedRequest);

    } catch (error) {
        console.error('Lỗi cập nhật yêu cầu hoàn trả:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};