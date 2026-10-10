// controllers/categoryController.js
const Category = require('../models/Category')

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 })
    res.json({ success: true, count: categories.length, data: categories })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.createCategory = async (req, res) => {
  try {
    const id = `cat-${Date.now()}`
    const category = await Category.create({ ...req.body, id })
    res.status(201).json({ success: true, data: category })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' })
    res.json({ success: true, data: category })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findOneAndDelete({ id: req.params.id })
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found' })
    res.json({ success: true, message: 'Category deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
