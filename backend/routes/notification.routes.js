// routes/notification.routes.js
const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.put('/mark-all-read', markAllAsRead);
router.get('/', getMyNotifications);
router.put('/:id/read', markAsRead);

module.exports = router;