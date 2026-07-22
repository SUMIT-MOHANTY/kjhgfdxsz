const { body } = require('express-validator');

const validateBook = [
  body('isbn')
    .notEmpty()
    .withMessage('ISBN is required')
    .isLength({ min: 10, max: 17 })
    .withMessage('ISBN must be between 10 and 17 characters'),
  
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('author')
    .notEmpty()
    .withMessage('Author is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Category must be a valid ID'),
  
  body('totalCopies')
    .isInt({ min: 0 })
    .withMessage('Total copies must be a non-negative integer'),
  
  body('availableCopies')
    .isInt({ min: 0 })
    .withMessage('Available copies must be a non-negative integer'),
  
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Published year must be a valid year'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number')
];

const validateBookUpdate = [
  body('isbn')
    .optional()
    .isLength({ min: 10, max: 17 })
    .withMessage('ISBN must be between 10 and 17 characters'),
  
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('author')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters'),
  
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid ID'),
  
  body('totalCopies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total copies must be a non-negative integer'),
  
  body('availableCopies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available copies must be a non-negative integer'),
  
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Published year must be a valid year'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number')
];

const validateCategory = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('parentCategory')
    .optional()
    .isMongoId()
    .withMessage('Parent category must be a valid ID')
];

const validateAvailability = [
  body('availableCopies')
    .isInt({ min: 0 })
    .withMessage('Available copies must be a non-negative integer')
];

module.exports = {
  validateBook,
  validateBookUpdate,
  validateCategory,
  validateAvailability
};