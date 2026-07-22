const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { validateBook, validateBookUpdate, validateAvailability } = require('../middleware/validation');
const auth = require('../middleware/auth');

// Public routes
router.get('/', bookController.getAllBooks);
router.get('/search', bookController.searchBooks);
router.get('/:id', bookController.getBookById);

// Protected routes (require authentication)
router.post('/', auth, validateBook, bookController.createBook);
router.put('/:id', auth, validateBookUpdate, bookController.updateBook);
router.patch('/:id/availability', auth, validateAvailability, bookController.updateAvailability);
router.delete('/:id', auth, bookController.deleteBook);

module.exports = router;