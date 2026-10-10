// routes/resources.js
const express = require('express')
const router = express.Router()
const {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  addReview,
} = require('../controllers/resourceController')
const { protect } = require('../middleware/auth')

router.get('/', getResources)
router.get('/:id', getResourceById)
router.post('/', protect, createResource)
router.put('/:id', protect, updateResource)
router.delete('/:id', protect, deleteResource)
router.post('/:id/reviews', protect, addReview)

module.exports = router
