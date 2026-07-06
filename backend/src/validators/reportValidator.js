const { body } = require('express-validator');

exports.attendanceValidator = [
  body('remarks').optional().trim(),
];

const dprNumberField = (field) =>
  body(field).optional().isInt({ min: 0 }).withMessage('Must be a non-negative integer');

exports.dprValidator = [
  body('candidate').notEmpty().withMessage('Candidate is required'),
  dprNumberField('longApp'),
  dprNumberField('shortApp'),
  dprNumberField('availability'),
  dprNumberField('screening'),
  dprNumberField('assessment'),
  body('remarks').optional().trim(),
];
