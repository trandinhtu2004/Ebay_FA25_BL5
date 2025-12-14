// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/admin.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');

// Bảo vệ tất cả route admin
router.use(protect, isAdmin);

// Route lấy stats
router.get('/stats', getDashboardStats);

module.exports = router;