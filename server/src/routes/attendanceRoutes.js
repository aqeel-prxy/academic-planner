const express = require('express');
const router = express.Router();
const attendanceController = require('../controller/attendanceController');

router.get('/', attendanceController.list);
router.post('/', attendanceController.upsert);
router.put('/:id', attendanceController.update);
router.delete('/:id', attendanceController.remove);

module.exports = router;
