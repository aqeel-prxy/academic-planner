const express = require('express');
const router = express.Router();
const assignmentController = require('../controller/assignmentController');
const { validateAssignment, validateAssignmentUpdate } = require('../middleware/validation');

router.get('/', assignmentController.getAssignments);
router.get('/summary', assignmentController.getAssignmentSummary);
router.get('/:id', assignmentController.getAssignmentById);
router.post('/', validateAssignment, assignmentController.createAssignment);
router.put('/:id', validateAssignmentUpdate, assignmentController.updateAssignment);
router.delete('/:id', assignmentController.deleteAssignment);

module.exports = router;
