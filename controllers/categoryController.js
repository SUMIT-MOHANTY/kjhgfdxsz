const Category = require('../models/Category');
const Book = require('../models/Book');
const { validationResult } = require('express-validator');

class CategoryController {
  // Create a new category
  async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const existingCategory = await Category.findOne({ name: req.body.name });
      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }

      const category = new Category(req.body);
      await category.save();
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating category',
        error: error.message
      });
    }
  }

  // Get all categories
  async getAllCategories(req, res) {
    try {
      const { includeInactive = false } = req.query;
      
      const filter = includeInactive === 'true' ? {} : { isActive: true };
      
      const categories = await Category.find(filter)
        .populate('parentCategory')
        .populate('subcategories')
        .sort({ name: 1 });

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching categories',
        error: error.message
      });
    }
  }

  // Get category by ID
  async getCategoryById(req, res) {
    try {
      const category = await Category.findById(req.params.id)
        .populate('parentCategory')
        .populate('subcategories');
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Get book count for this category
      const bookCount = await Book.countDocuments({ category: category._id, status: 'active' });

      res.json({
        success: true,
        data: {
          ...category.toObject(),
          bookCount
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching category',
        error: error.message
      });
    }
  }

  // Update category
  async updateCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const category = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('parentCategory').populate('subcategories');

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating category',
        error: error.message
      });
    }
  }

  // Delete category
  async deleteCategory(req, res) {
    try {
      const bookCount = await Book.countDocuments({ category: req.params.id });
      
      if (bookCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category that has books assigned to it'
        });
      }

      const category = await Category.findByIdAndDelete(req.params.id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting category',
        error: error.message
      });
    }
  }
}

module.exports = new CategoryController();