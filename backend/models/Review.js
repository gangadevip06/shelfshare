// models/Review.js
const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    resourceId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Review', ReviewSchema)
