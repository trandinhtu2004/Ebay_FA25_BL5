// routes/payment.routes.js
const express = require('express');
const router = express.Router();
const { createMomoPayment ,returnData} = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
router.post('/momo', protect, createMomoPayment);
router.post('/momo_process_return', protect, returnData);


module.exports = router;