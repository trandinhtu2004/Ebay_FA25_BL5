// controllers/user.controller.js
const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
// Hàm xử lý logic đăng ký (ĐÃ CẬP NHẬT)
exports.registerUser = async (req, res) => {
    try {
        // Nhận thêm 'username' từ req.body
        const { username, email, password } = req.body;

        // 1. Kiểm tra dữ liệu đầu vào
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng cung cấp username, email và mật khẩu.' });
        }

        // 2. Kiểm tra xem email hoặc username đã tồn tại chưa
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email hoặc Username này đã được sử dụng.' });
        }

        // 3. Tạo người dùng mới
        const newUser = new User({
            username,
            email,
            password
            // Role sẽ tự động là 'buyer' (mặc định)
        });

        // 4. Lưu người dùng vào DB
        await newUser.save();

        // 5. Trả về thành công
        res.status(201).json({
            message: 'Đăng ký thành công!',
            userId: newUser._id,
            username: newUser.username
        });

    } catch (error) {
        console.error('Lỗi khi đăng ký người dùng:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi phía máy chủ.' });
    }
};

// Hàm xử lý logic đăng nhập 
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Kiểm tra email và password
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
        }

        // 2. Tìm người dùng trong DB
        // Chúng ta dùng .select('+password') vì trong model, 
        // có thể chúng ta sẽ ẩn mật khẩu khi truy vấn
        // (Hiện tại chưa ẩn, nhưng đây là cách làm tốt)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
        }

        // 3. So sánh mật khẩu (sử dụng hàm chúng ta đã tạo trong model)
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
        }

        // 4. Nếu mật khẩu khớp, tạo JWT 
        const payload = {
            userId: user._id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token hết hạn sau 1 ngày
        );

        // 5. Trả token về cho client
        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token: token,
            user: {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatarURL: user.avatarURL
            }
        });

    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi phía máy chủ.' });
    }
};

// === HÀM MỚI 1 (Admin) ===
// @desc    Lấy tất cả người dùng (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        // Lấy tất cả user, trừ password, sắp xếp theo tên
        const users = await User.find({}).select('-password').sort({ username: 1 });
        res.status(200).json(users);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách user:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// === HÀM MỚI 2 (Admin) ===
// @desc    Cập nhật thông tin user bởi Admin (ví dụ: đổi role)
// @route   PUT /api/users/:id/admin
// @access  Private/Admin
exports.updateUserByAdmin = async (req, res) => {
    const { role } = req.body; // Chỉ cho phép admin đổi role (tạm thời)
    const userId = req.params.id;

    // Kiểm tra xem role có hợp lệ không
    if (role && !['buyer', 'seller', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        // Cập nhật role nếu được cung cấp
        user.role = role || user.role;

        await user.save();
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        });

    } catch (error) {
        console.error('Lỗi khi admin cập nhật user:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// === HÀM MỚI (User tự cập nhật) ===
// @desc    Cập nhật thông tin cá nhân (Nhóm 1)
// @route   PUT /api/users/profile
// @access  Private
exports.updateMyProfile = async (req, res) => {
    // Chỉ cho phép cập nhật username và avatarURL (tạm thời)
    // Cập nhật email/password sẽ phức tạp hơn (cần xác nhận)
    const { username, avatarURL } = req.body;
    const userId = req.user._id; // Lấy từ middleware 'protect'

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        // Kiểm tra xem username mới có bị trùng không (nếu có thay đổi)
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username này đã được sử dụng.' });
            }
            user.username = username;
        }

        // Cập nhật avatarURL (nếu có)
        // Dùng ?? null để cho phép xóa avatar
        user.avatarURL = avatarURL ?? user.avatarURL;

        const updatedUser = await user.save();

        // Trả về thông tin user đã cập nhật (không có password)
        res.status(200).json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            avatarURL: updatedUser.avatarURL
        });

    } catch (error) {
        console.error('Lỗi cập nhật profile:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};