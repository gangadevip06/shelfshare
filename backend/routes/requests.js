// routes/requests.js
const express = require('express')
const router = express.Router()
const {
  getRequests,
  getRequestById,
  createRequest,
  updateStatus,
  approveWithLocation,
  recordPayment,
  updateHandover,
  confirmCode,
  completeWithCondition,
  requestExtension,
  approveExtension,
  rejectExtension,
  payExtension,
} = require('../controllers/requestController')
const { protect, optionalProtect } = require('../middleware/auth')

router.get('/', optionalProtect, getRequests)
router.get('/:id', optionalProtect, getRequestById)
router.post('/', optionalProtect, createRequest)
router.put('/:id/status', protect, updateStatus)
router.put('/:id/approve', protect, approveWithLocation)
router.put('/:id/payment', protect, recordPayment)
router.put('/:id/handover', protect, updateHandover)
router.put('/:id/confirm-code', protect, confirmCode)
router.put('/:id/complete-condition', protect, completeWithCondition)

// Extension routes
router.post('/:id/extension', optionalProtect, requestExtension)
router.put('/:id/extension/approve', optionalProtect, approveExtension)
router.put('/:id/extension/reject', optionalProtect, rejectExtension)
router.put('/:id/extension/pay', optionalProtect, payExtension)

module.exports = router
