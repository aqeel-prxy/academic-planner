const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { validateEvent } = require('../middleware/validation');

// GET all events
router.get('/', eventController.getAllEvents);

// GET single event
router.get('/:id', eventController.getEventById);

// POST create new event
router.post('/', validateEvent, eventController.createEvent);

// PUT update event
router.put('/:id', validateEvent, eventController.updateEvent);

// DELETE event
router.delete('/:id', eventController.deleteEvent);

// DELETE all events (for testing)
router.delete('/', eventController.deleteAllEvents);

console.log('✅ Event routes loaded successfully');

module.exports = router;