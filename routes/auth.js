const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 1. Student Registration Endpoint
router.post('/register', authController.registerStudent);

// 2. Student Login Endpoint
router.post('/login/student', authController.loginStudent);

// 3. Admin Login Endpoint
router.post('/login/admin', authController.loginAdmin);

// 4. Session Check Endpoint (checks active cookie)
router.get('/me', authController.getMe);

// 5. Logout Endpoint
router.post('/logout', authController.logout);

module.exports = router;
