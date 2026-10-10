// models/Wishlist.js
const mongoose = require('mongoose')

const WishlistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    items: [{ type: String }], // Array of resource IDs
  },
  { timestamps: true }
)

module.exports = mongoose.model('Wishlist', WishlistSchema)
