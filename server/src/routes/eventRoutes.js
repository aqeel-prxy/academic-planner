const express = require('express');
const router = express.Router();
const eventController = require('../controller/eventController');
const { validateEvent, validateEventUpdate } = require('../middleware/validation');

// GET all events
router.get('/', eventController.getAllEvents);

// GET single event
router.get('/:id', eventController.getEventById);

// POST create new event
router.post('/', validateEvent, eventController.createEvent);

// PUT update event (partial updates allowed for drag/resize)
router.put('/:id', validateEventUpdate, eventController.updateEvent);

// DELETE event
router.delete('/:id', eventController.deleteEvent);

// DELETE all events (for testing)
router.delete('/', eventController.deleteAllEvents);

console.log('✅ Event routes loaded successfully');

module.exports = router;