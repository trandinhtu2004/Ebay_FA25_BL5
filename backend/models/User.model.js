// models/User.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    // Thêm username theo schema [cite: 12, 16]
    username: {
        type: String,
        required: [true, 'Username là bắt buộc'],
        unique: true,
        trim: true // Xóa khoảng trắng thừa
    },
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        match: [/.+\@.+\..+/, 'Email không hợp lệ'],
        lowercase: true, // Lưu email ở dạng chữ thường
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc']
    },
    // Thêm role (vai trò) theo schema [cite: 31, 32]
    role: {
        type: String,
        enum: ['buyer', 'seller', 'admin'], // Chỉ cho phép 3 giá trị này
        default: 'buyer' // Mặc định là người mua
    },
    // Thêm avatarURL theo schema [cite: 39, 40]
    avatarURL: {
        type: String,
        default: '' // Mặc định không có avatar
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
    },
},
 {
    timestamps: true 
});

// Hook: Mã hóa mật khẩu trước khi lưu (Không đổi) 
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Thêm một phương thức để kiểm tra mật khẩu (sẽ dùng cho Đăng nhập)
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);