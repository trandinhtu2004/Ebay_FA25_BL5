// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Middleware 1: Kiểm tra xem đã đăng nhập (JWT hợp lệ)
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Lấy token từ header
            token = req.headers.authorization.split(' ')[1];

            // 2. Xác thực token (dùng SECRET từ .env)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Lấy thông tin user (trừ password) và gắn vào request (req.user)
            req.user = await User.findById(decoded.userId).select('-password');
            
            if (!req.user) {
                 return res.status(401).json({ message: 'Người dùng không tồn tại.' });
            }
            
            next(); // Cho phép đi tiếp
        } catch (error) {
            console.error('Lỗi xác thực token:', error);
            return res.status(401).json({ message: 'Token không hợp lệ, không có quyền truy cập.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy token, không có quyền truy cập.' });
    }
};

// Middleware 2: Kiểm tra xem có phải là Seller
exports.isSeller = (req, res, next) => {
    // Middleware này phải chạy SAU 'protect'
    if (req.user && req.user.role === 'seller') {
        next(); // Là seller, cho phép đi tiếp
    } else {
        res.status(403).json({ message: 'Truy cập bị cấm. Yêu cầu quyền Người bán (Seller).' });
    }
};

// (Chúng ta sẽ thêm 'isAdmin' sau này)
// Kiểm tra xem có phải là Admin (phải chạy SAU 'protect')
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // Là admin, cho phép đi tiếp
    } else {
        res.status(403).json({ message: 'Truy cập bị cấm. Yêu cầu quyền Quản trị viên (Admin).' });
    }
};