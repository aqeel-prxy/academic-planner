const { Op } = require('sequelize');
const Assignment = require('../models/Assignment');
const { validationResult } = require('express-validator');

const STATUS = {
  pending: 'Pending',
  completed: 'Completed'
};

const PRIORITY_ORDER = {
  High: 3,
  Medium: 2,
  Low: 1
};

const normalizeChecklist = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => ({
      id: String(item.id || `check-${index + 1}`),
      text: String(item.text || '').trim(),
      completed: Boolean(item.completed)
    }))
    .filter((item) => item.text);
};

const decorateAssignment = (assignment) => {
  const plain = assignment.get ? assignment.get({ plain: true }) : assignment;
  const dueDate = new Date(plain.dueDate);
  const isCompleted = plain.status === STATUS.completed;
  const isOverdue = !isCompleted && dueDate < new Date();
  const checklist = normalizeChecklist(plain.checklist);
  const completedItems = checklist.filter((item) => item.completed).length;

  return {
    ...plain,
    checklist,
    status: isCompleted ? STATUS.completed : (isOverdue ? 'Overdue' : STATUS.pending),
    progress: checklist.length === 0 ? (isCompleted ? 100 : 0) : Math.round((completedItems / checklist.length) * 100),
    checklistCompletedCount: completedItems,
    checklistTotalCount: checklist.length,
    isReadOnly: isCompleted
  };
};

const buildFilters = (query) => {
  const where = {};

  if (query.search) {
    const searchTerm = `%${query.search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: searchTerm } },
      { course: { [Op.like]: searchTerm } }
    ];
  }

  if (query.priority && ['High', 'Medium', 'Low'].includes(query.priority)) {
    where.priority = query.priority;
  }

  if (query.status === 'Pending') {
    where.status = STATUS.pending;
    where.dueDate = { [Op.gte]: new Date() };
  }

  if (query.status === 'Completed') {
    where.status = STATUS.completed;
  }

  if (query.status === 'Overdue') {
    where.status = STATUS.pending;
    where.dueDate = { [Op.lt]: new Date() };
  }

  return where;
};

const sortAssignments = (assignments, sortBy) => {
  const sorted = [...assignments];

  switch (sortBy) {
    case 'priority':
      sorted.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
      break;
    case 'course':
      sorted.sort((a, b) => a.course.localeCompare(b.course));
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'dueDate':
    default:
      sorted.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      break;
  }

  return sorted;
};

const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      where: buildFilters(req.query),
      order: [['dueDate', 'ASC']]
    });

    res.json(sortAssignments(assignments.map(decorateAssignment), req.query.sortBy));
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(decorateAssignment(assignment));
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
};

const getAssignmentSummary = async (req, res) => {
  try {
    const assignments = (await Assignment.findAll()).map(decorateAssignment);

    const summary = assignments.reduce((acc, assignment) => {
      acc.total += 1;
      if (assignment.status === 'Completed') acc.completed += 1;
      else if (assignment.status === 'Overdue') acc.overdue += 1;
      else acc.pending += 1;
      return acc;
    }, {
      total: 0,
      pending: 0,
      completed: 0,
      overdue: 0
    });

    res.json(summary);
  } catch (error) {
    console.error('Error fetching assignment summary:', error);
    res.status(500).json({ error: 'Failed to fetch assignment summary' });
  }
};

const validateCourseWeighting = async (course, weighting, excludeId = null) => {
  const existingWeighting = await Assignment.sum('weighting', {
    where: {
      course,
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {})
    }
  });

  return Number(existingWeighting || 0) + Number(weighting || 0);
};

const createAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const totalWeighting = await validateCourseWeighting(req.body.course, req.body.weighting);
    if (totalWeighting > 100) {
      return res.status(400).json({
        error: 'Weighting for this course cannot exceed 100%'
      });
    }

    const checklist = normalizeChecklist(req.body.checklist);
    const assignment = await Assignment.create({
      ...req.body,
      id: req.body.id || `assignment-${Date.now()}`,
      checklist,
      completedAt: req.body.status === STATUS.completed ? new Date() : null
    });

    res.status(201).json(decorateAssignment(assignment));
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const nextStatus = req.body.status || assignment.status;
    const isCompleted = assignment.status === STATUS.completed;
    const lockedFields = ['title', 'course', 'dueDate', 'weighting', 'description', 'priority', 'attachmentName', 'attachmentUrl'];
    const attemptsLockedEdit = isCompleted && lockedFields.some((field) => req.body[field] !== undefined) && nextStatus === STATUS.completed;

    if (attemptsLockedEdit) {
      return res.status(400).json({
        error: 'Completed assignments are locked. Reopen the assignment before editing.'
      });
    }

    const course = req.body.course || assignment.course;
    const weighting = req.body.weighting !== undefined ? req.body.weighting : assignment.weighting;
    const totalWeighting = await validateCourseWeighting(course, weighting, assignment.id);
    if (totalWeighting > 100) {
      return res.status(400).json({
        error: 'Weighting for this course cannot exceed 100%'
      });
    }

    const payload = { ...req.body };
    if (payload.checklist !== undefined) {
      payload.checklist = normalizeChecklist(payload.checklist);
    }

    if (payload.status) {
      payload.completedAt = payload.status === STATUS.completed ? (assignment.completedAt || new Date()) : null;
    }

    await assignment.update(payload);
    res.json(decorateAssignment(assignment));
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await assignment.destroy();
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
};

module.exports = {
  getAssignments,
  getAssignmentById,
  getAssignmentSummary,
  createAssignment,
  updateAssignment,
  deleteAssignment
};
