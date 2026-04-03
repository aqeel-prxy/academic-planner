const express = require('express');
const router = express.Router();
const eventController = require('../controller/eventController');
const { validateEvent, validateEventUpdate } = require('../middleware/validation');

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', validateEvent, eventController.createEvent);
router.put('/:id', validateEventUpdate, eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.delete('/', eventController.deleteAllEvents);

module.exports = router;
