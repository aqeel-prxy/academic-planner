const { body } = require('express-validator');

// datetime-local sends "YYYY-MM-DDTHH:mm" - normalize to ISO with seconds for validation
const normalizeDatetime = (v) => {
  if (typeof v !== 'string') return v;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return v + ':00';
  return v;
};

const validateEvent = [
  body('title').notEmpty().withMessage('Title is required'),
  body('courseCode').notEmpty().withMessage('Course code is required'),
  body('start').customSanitizer(normalizeDatetime).isISO8601().withMessage('Valid start date is required'),
  body('end').customSanitizer(normalizeDatetime).isISO8601().withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('location').optional().isString()
];

// For PUT: allow partial updates (e.g. drag/resize only sends start/end)
const validateEventUpdate = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('courseCode').optional().notEmpty().withMessage('Course code cannot be empty'),
  body('start').optional().isISO8601().withMessage('Valid start date required'),
  body('end').optional().isISO8601().withMessage('Valid end date required')
    .custom((value, { req }) => {
      if (value != null && req.body.start != null && new Date(value) <= new Date(req.body.start)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('location').optional().isString(),
  body('backgroundColor').optional().isString(),
  body('borderColor').optional().isString()
];

module.exports = { validateEvent, validateEventUpdate };