// controllers/wishlistController.js
const Wishlist = require('../models/Wishlist')

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.sub
    let wishlist = await Wishlist.findOne({ userId })
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, items: [] })
    }
    res.json({ success: true, data: wishlist.items })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.toggleWishlist = async (req, res) => {
  try {
    const userId = req.body.userId || req.user.sub
    const { resourceId } = req.body

    let wishlist = await Wishlist.findOne({ userId })
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, items: [resourceId] })
      return res.json({ success: true, data: wishlist.items })
    }

    const index = wishlist.items.indexOf(resourceId)
    if (index === -1) {
      wishlist.items.push(resourceId)
    } else {
      wishlist.items.splice(index, 1)
    }

    await wishlist.save()
    res.json({ success: true, data: wishlist.items })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
