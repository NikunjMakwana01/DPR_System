const { body } = require('express-validator');

exports.registerValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('mobileNumber')
    .trim()
    .matches(/^[0-9+\-\s()]{10,15}$/)
    .withMessage('Valid mobile number is required'),
];

exports.loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

exports.resetPasswordValidator = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
