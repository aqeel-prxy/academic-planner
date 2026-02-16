const { body } = require('express-validator');

const validateEvent = [
  body('title').notEmpty().withMessage('Title is required'),
  body('courseCode').notEmpty().withMessage('Course code is required'),
  body('start').isISO8601().withMessage('Valid start date is required'),
  body('end').isISO8601().withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('location').optional().isString()
];

module.exports = { validateEvent };