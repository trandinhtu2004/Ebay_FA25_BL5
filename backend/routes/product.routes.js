// backend/routes/product.routes.js
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth.middleware');
const { getAllProductsAdmin } = require('../controllers/product.controller');
// 1. Đổi tên hàm import
const { 
    getProducts, 
    createProduct, 
    importFromText, // <-- Đổi thành importFromText
    getMyProducts,  // <-- MỚI
    getProductById, // <-- MỚI
    updateProduct,   // <-- MỚI
    deleteProduct,
    toggleProductActive
} = require('../controllers/product.controller');

const { protect, isSeller } = require('../middleware/auth.middleware');
// KHÔNG require 'upload.middleware'

// Route xem sản phẩm (Public)
router.get('/', getProducts);

// Route đăng sản phẩm thủ công (Seller)
router.post('/', protect, isSeller, createProduct);

// Route import mới (Copy-Paste)
router.post(
    '/import-text', // <-- 1. Đổi tên route
    protect,
    isSeller,
    importFromText  // <-- 2. Dùng hàm mới (không có upload)
);
// @route   GET /api/products/myproducts (Lấy SP của seller)
// (PHẢI ĐẶT TRƯỚC /:id)
router.get('/myproducts', protect, isSeller, getMyProducts);

// --- Public Route (đặt sau /myproducts) ---
// @route   GET /api/products/:id (Lấy chi tiết 1 SP)
router.get('/:id', getProductById); 

// --- Seller Route ---
// @route   PUT /api/products/:id (Cập nhật SP)
router.put('/:id', protect, isSeller, updateProduct);
router.delete('/:id', protect, isSeller, deleteProduct);
module.exports = router;



router.put('/:id/toggle', protect, toggleProductActive);
router.get('/admin/all', protect, isAdmin, getAllProductsAdmin);