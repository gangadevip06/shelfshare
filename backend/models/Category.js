// models/Category.js
const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, default: '📦' },
    tag: { type: String, default: 'general' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Category', CategorySchema)
