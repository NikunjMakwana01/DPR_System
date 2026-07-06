const { body } = require('express-validator');

exports.candidateValidator = [
  body('name').trim().notEmpty().withMessage('Candidate name is required'),
  body('jobRole').trim().notEmpty().withMessage('Job role is required'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'placed', 'on-hold'])
    .withMessage('Invalid status'),
  body('remarks').optional().trim(),
];
