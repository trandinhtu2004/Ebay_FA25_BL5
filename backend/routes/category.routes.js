// routes/category.routes.js
const express = require('express');
const router = express.Router();
const { getCategories } = require('../controllers/category.controller');

// Ai cũng có thể xem danh mục
router.get('/', getCategories);

module.exports = router;