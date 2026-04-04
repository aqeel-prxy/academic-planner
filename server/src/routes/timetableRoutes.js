const express = require('express');
const router = express.Router();
const timetableController = require('../controller/timetableController');

router.get('/', timetableController.listTimetables);
router.get('/:timetableKey/courses', timetableController.coursesForTimetable);

module.exports = router;
