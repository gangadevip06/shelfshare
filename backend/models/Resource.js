// models/Resource.js
const mongoose = require('mongoose')

const ReviewSubSchema = new mongoose.Schema({
  id: String,
  user: String,
  userId: String,
  rating: Number,
  comment: String,
  date: String,
})

const BookedRangeSubSchema = new mongoose.Schema({
  requestId: String,
  start: String,
  end: String,
})

const ResourceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    condition: { type: String, default: 'Good' },
    sharingType: { type: String, enum: ['Rent Only', 'Buy Only', 'Rent or Buy'], default: 'Rent or Buy' },
    rentalPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
    availability: { type: String, enum: ['Available', 'Unavailable'], default: 'Available' },
    location: { type: String, default: 'Anna Nagar, Chennai' },
    image: { type: String, default: '' },
    ownerId: { type: String, required: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, default: '' },
    ownerPhone: { type: String, default: '' },
    rating: { type: Number, default: 4.5 },
    reviews: [ReviewSubSchema],
    bookedRanges: [BookedRangeSubSchema],
    status: { type: String, default: 'Active' },
    createdAt: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Resource', ResourceSchema)
