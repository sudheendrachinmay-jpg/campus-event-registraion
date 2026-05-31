const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');
const { requireLogin } = require('../middleware/authMiddleware');

// Secure all query console endpoints
router.use(requireLogin);

// 1. Fetch the preset SQL queries and viva explanations
router.get('/presets', queryController.getPresets);

// 2. Securely execute a SELECT query in the live playground console
router.post('/run', queryController.runQuery);

module.exports = router;
