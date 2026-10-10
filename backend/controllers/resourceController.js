// controllers/resourceController.js
const Resource = require('../models/Resource')

// @desc    Get all resources (with optional filters)
// @route   GET /api/resources
exports.getResources = async (req, res) => {
  try {
    const { category, sharingType, availability, search, location } = req.query
    const filter = {}

    if (category) filter.category = category
    if (sharingType) filter.sharingType = sharingType
    if (availability) filter.availability = availability
    if (location) filter.location = location
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const resources = await Resource.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, count: resources.length, data: resources })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get resource by ID
// @route   GET /api/resources/:id
exports.getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findOne({ id: req.params.id })
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' })
    }
    res.json({ success: true, data: resource })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create new resource
// @route   POST /api/resources
exports.createResource = async (req, res) => {
  try {
    const resourceId = req.body.id || `res-${Date.now()}`
    const ownerId = (req.user && req.user.sub) || req.body.ownerId || 'user-unknown'
    const ownerName = (req.user && req.user.name) || req.body.ownerName || 'User'
    const ownerEmail = (req.user && req.user.email) || req.body.ownerEmail || ''
    const ownerPhone = req.body.ownerPhone || (req.user && req.user.phone) || ''

    const existing = await Resource.findOne({ id: resourceId })
    if (existing) {
      const updated = await Resource.findOneAndUpdate(
        { id: resourceId },
        { ...req.body, ownerId, ownerName, ownerEmail, ...(ownerPhone ? { ownerPhone } : {}) },
        { new: true }
      )
      return res.json({ success: true, data: updated })
    }

    const newResource = await Resource.create({
      ...req.body,
      id: resourceId,
      ownerId,
      ownerName,
      ownerEmail,
      ownerPhone,
      status: req.body.status || 'Active',
      createdAt: req.body.createdAt || new Date().toISOString().slice(0, 10),
    })
    res.status(201).json({ success: true, data: newResource })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update resource
// @route   PUT /api/resources/:id
exports.updateResource = async (req, res) => {
  try {
    const updated = await Resource.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Resource not found' })
    }
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete resource
// @route   DELETE /api/resources/:id
exports.deleteResource = async (req, res) => {
  try {
    const deleted = await Resource.findOneAndDelete({ id: req.params.id })
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Resource not found' })
    }
    res.json({ success: true, message: 'Resource deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Add review to resource
// @route   POST /api/resources/:id/reviews
exports.addReview = async (req, res) => {
  try {
    const resource = await Resource.findOne({ id: req.params.id })
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' })
    }

    const { rating, comment, userName, userId } = req.body
    const newReview = {
      id: `rev-${Date.now()}`,
      userId: userId || req.user.sub,
      user: userName || req.user.name,
      rating: Number(rating),
      comment,
      date: new Date().toISOString().slice(0, 10),
    }

    resource.reviews.push(newReview)
    const totalRating = resource.reviews.reduce((acc, r) => acc + r.rating, 0)
    resource.rating = +(totalRating / resource.reviews.length).toFixed(1)

    await resource.save()
    res.status(201).json({ success: true, data: resource })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
