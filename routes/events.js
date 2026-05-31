const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { requireStudent, requireAdmin, requireLogin } = require('../middleware/authMiddleware');

// 1. Fetch all events (accessible to logged-in students and admins)
router.get('/', requireLogin, eventController.getAllEvents);

// 2. Fetch student's registered events
router.get('/my-registrations', requireStudent, eventController.getMyRegisteredEvents);

// 3. Fetch single event details
router.get('/:id', requireLogin, eventController.getEventById);

// 4. Register student for an event (requires student role)
router.post('/register', requireStudent, eventController.registerForEvent);

// 5. Cancel student registration for an event (requires student role)
router.post('/cancel', requireStudent, eventController.cancelRegistration);

// 6. Admin: Add new campus event
router.post('/add', requireAdmin, eventController.addEvent);

// 7. Admin: Update campus event details
router.put('/update/:id', requireAdmin, eventController.updateEvent);

// 8. Admin: Delete campus event (cascades registrations)
router.delete('/delete/:id', requireAdmin, eventController.deleteEvent);

module.exports = router;
