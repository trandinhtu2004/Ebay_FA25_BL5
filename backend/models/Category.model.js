// models/Category.model.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    // [cite: 17]
    name: {
        type: String,
        required: [true, 'Tên danh mục là bắt buộc'],
        unique: true,
        trim: true
    }
    // Chúng ta có thể thêm danh mục cha (parent category) sau này
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);