const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authMiddleware');

// Protect all admin endpoints with admin session requirement
router.use(requireAdmin);

// 1. Fetch dashboard statistical counts and chart points
router.get('/stats', adminController.getDashboardStats);

// 2. Fetch student profiles list (supports ?search=...)
router.get('/students', adminController.getStudentsList);

// 3. Fetch composite registration join records (supports ?search=...)
router.get('/registrations', adminController.getRegistrationsList);

module.exports = router;
