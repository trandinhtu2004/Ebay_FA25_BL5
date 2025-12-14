// controllers/category.controller.js
const Category = require('../models/Category.model');

// @desc    Lấy tất cả danh mục
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        console.error('Lỗi khi lấy danh mục:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// (Sau này chúng ta có thể thêm 'createCategory' cho Admin)