const Book = require('../models/Book');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');

class BookController {
  // Create a new book
  async createBook(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const existingBook = await Book.findOne({ isbn: req.body.isbn });
      if (existingBook) {
        return res.status(409).json({
          success: false,
          message: 'Book with this ISBN already exists'
        });
      }

      const book = new Book(req.body);
      await book.save();
      await book.populate('category');
      
      res.status(201).json({
        success: true,
        message: 'Book created successfully',
        data: book
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating book',
        error: error.message
      });
    }
  }

  // Get all books with filtering and pagination
  async getAllBooks(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        author,
        search,
        available,
        status = 'active'
      } = req.query;

      const filter = { status };
      
      if (category) filter.category = category;
      if (author) filter.author = new RegExp(author, 'i');
      if (available === 'true') filter.availableCopies = { $gt: 0 };
      if (search) {
        filter.$text = { $search: search };
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: 'category',
        sort: { createdAt: -1 }
      };

      const books = await Book.find(filter)
        .populate('category')
        .sort(options.sort)
        .limit(options.limit * 1)
        .skip((options.page - 1) * options.limit);

      const total = await Book.countDocuments(filter);
      
      res.json({
        success: true,
        data: {
          books,
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            pages: Math.ceil(total / options.limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching books',
        error: error.message
      });
    }
  }

  // Get book by ID
  async getBookById(req, res) {
    try {
      const book = await Book.findById(req.params.id).populate('category');
      
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      res.json({
        success: true,
        data: book
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching book',
        error: error.message
      });
    }
  }

  // Update book
  async updateBook(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const book = await Book.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('category');

      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      res.json({
        success: true,
        message: 'Book updated successfully',
        data: book
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating book',
        error: error.message
      });
    }
  }

  // Delete book
  async deleteBook(req, res) {
    try {
      const book = await Book.findByIdAndDelete(req.params.id);
      
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      res.json({
        success: true,
        message: 'Book deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting book',
        error: error.message
      });
    }
  }

  // Search books
  async searchBooks(req, res) {
    try {
      const { q, category, author, limit = 10 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const filter = {
        $and: [
          { status: 'active' },
          {
            $or: [
              { title: new RegExp(q, 'i') },
              { author: new RegExp(q, 'i') },
              { isbn: new RegExp(q, 'i') },
              { description: new RegExp(q, 'i') }
            ]
          }
        ]
      };

      if (category) filter.$and.push({ category });
      if (author) filter.$and.push({ author: new RegExp(author, 'i') });

      const books = await Book.find(filter)
        .populate('category')
        .limit(parseInt(limit))
        .sort({ title: 1 });

      res.json({
        success: true,
        data: books
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching books',
        error: error.message
      });
    }
  }

  // Update book availability
  async updateAvailability(req, res) {
    try {
      const { availableCopies } = req.body;
      
      const book = await Book.findById(req.params.id);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      if (availableCopies > book.totalCopies) {
        return res.status(400).json({
          success: false,
          message: 'Available copies cannot exceed total copies'
        });
      }

      book.availableCopies = availableCopies;
      await book.save();
      await book.populate('category');

      res.json({
        success: true,
        message: 'Book availability updated successfully',
        data: book
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating book availability',
        error: error.message
      });
    }
  }
}

module.exports = new BookController();