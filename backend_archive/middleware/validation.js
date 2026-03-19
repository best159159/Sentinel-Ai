const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Registration validation
const validateRegister = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    handleValidationErrors,
];

// Login validation
const validateLogin = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
];

// Incident validation
const validateIncident = [
    body('type')
        .isIn(['Flood', 'Fire', 'Earthquake', 'Accident', 'Crime', 'Storm', 'Other'])
        .withMessage('Invalid incident type'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 2000 })
        .withMessage('Description must be under 2000 characters')
        .escape(),
    body('location.lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Valid latitude is required'),
    body('location.lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Valid longitude is required'),
    handleValidationErrors,
];

module.exports = { validateRegister, validateLogin, validateIncident };
