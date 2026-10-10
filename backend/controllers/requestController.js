// controllers/requestController.js
const Request = require('../models/Request')
const Resource = require('../models/Resource')
const Notification = require('../models/Notification')
const Message = require('../models/Message')

// Helper for status history tracking
function pushHistory(request, key) {
  const history = request.statusHistory ? [...request.statusHistory] : []
  history.push({ key, at: new Date().toISOString() })
  return history
}

// @desc    Get all requests
// @route   GET /api/requests
exports.getRequests = async (req, res) => {
  try {
    const { userId, ownerId, requesterId, status } = req.query
    const filter = {}

    if (userId) {
      filter.$or = [{ requesterId: userId }, { ownerId: userId }]
    }
    if (ownerId) filter.ownerId = ownerId
    if (requesterId) filter.requesterId = requesterId
    if (status) filter.status = status

    const requests = await Request.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, count: requests.length, data: requests })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get single request by ID
// @route   GET /api/requests/:id
exports.getRequestById = async (req, res) => {
  try {
    const request = await Request.findOne({ id: req.params.id })
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' })
    }
    res.json({ success: true, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create new request
// @route   POST /api/requests
exports.createRequest = async (req, res) => {
  try {
    const requestId = req.body.id || `req-${Date.now()}`
    const existing = await Request.findOne({ id: requestId })
    if (existing) {
      const updated = await Request.findOneAndUpdate({ id: requestId }, req.body, { new: true })
      return res.json({ success: true, data: updated })
    }

    const isPreBooking = req.body.startDate && req.body.startDate > new Date().toISOString().slice(0, 10)

    const newRequest = await Request.create({
      ...req.body,
      id: requestId,
      status: req.body.status || 'Pending',
      paymentStatus: req.body.paymentStatus || 'Unpaid',
      handoverStatus: req.body.handoverStatus || 'Not Handed Over',
      isPreBooking: Boolean(isPreBooking),
      statusHistory: req.body.statusHistory && req.body.statusHistory.length > 0 ? req.body.statusHistory : [{ key: 'Requested', at: new Date().toISOString() }],
      requestedOn: req.body.requestedOn || new Date().toISOString().slice(0, 10),
    })

    // If pre-booking or rent, lock dates in resource bookedRanges tentatively
    if (req.body.startDate && req.body.endDate) {
      await Resource.findOneAndUpdate(
        { id: req.body.resourceId },
        {
          $push: {
            bookedRanges: {
              requestId,
              start: req.body.startDate,
              end: req.body.endDate,
            },
          },
        }
      )
    }

    res.status(201).json({ success: true, data: newRequest })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Approve request with pickup location
// @route   PUT /api/requests/:id/approve
exports.approveWithLocation = async (req, res) => {
  try {
    const { pickupLocation } = req.body
    const request = await Request.findOne({ id: req.params.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    const handoverCode = String(Math.floor(100000 + Math.random() * 900000))
    request.status = 'Approved'
    request.pickupLocation = pickupLocation
    request.handoverCode = handoverCode
    request.statusHistory = pushHistory(request, 'Approved')

    await request.save()

    // Add notification to requester
    await Notification.create({
      id: `notif-${Date.now()}`,
      userId: request.requesterId,
      type: 'approved',
      title: 'Request Approved',
      desc: `${request.ownerName} approved your request for "${request.resourceTitle}". Pickup: ${pickupLocation}.`,
      read: false,
    })

    // Mutual exclusion: If an active rental has a pending extension overlapping these dates,
    // decline that extension request since owner chose to accept THIS buyer instead!
    const overlappingExtensions = await Request.find({
      id: { $ne: request.id },
      resourceId: request.resourceId,
      extensionStatus: { $in: ['Requested', 'Pending'] },
      startDate: { $lte: request.endDate || request.requestedOn },
      extensionEndDate: { $gte: request.startDate || request.requestedOn },
    })

    for (const extReq of overlappingExtensions) {
      extReq.extensionStatus = 'Rejected'
      extReq.extensionRejectReason = 'Owner accepted another reservation for the requested dates.'
      extReq.statusHistory = pushHistory(extReq, 'Extension Declined - Another Booking Approved')
      await extReq.save()

      await Notification.create({
        id: `notif-${Date.now() + Math.random()}`,
        userId: extReq.requesterId,
        type: 'rejected',
        title: 'Rental Extension Declined',
        desc: `Your extension request for "${request.resourceTitle}" was declined because the owner accepted another reservation. Please return by ${extReq.endDate}.`,
        read: false,
      })

      await Message.create({
        id: `msg-${Date.now() + Math.random()}`,
        resourceId: request.resourceId,
        resourceTitle: request.resourceTitle,
        senderId: request.ownerId,
        senderName: request.ownerName,
        receiverId: extReq.requesterId,
        receiverName: extReq.requesterName,
        text: `Hi ${extReq.requesterName}, your extension request for "${request.resourceTitle}" cannot be accommodated as another reservation has been approved. Please return the item by ${extReq.endDate}.`,
        read: false,
      })
    }

    res.json({ success: true, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update request status (Reject, Cancel)
// @route   PUT /api/requests/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    const request = await Request.findOne({ id: req.params.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    request.status = status
    request.statusHistory = pushHistory(request, status)
    await request.save()

    // If cancelled or rejected, release dates from resource bookedRanges
    if (status === 'Cancelled' || status === 'Rejected') {
      await Resource.findOneAndUpdate(
        { id: request.resourceId },
        { $pull: { bookedRanges: { requestId: request.id } } }
      )
    }

    res.json({ success: true, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Record payment
// @route   PUT /api/requests/:id/payment
exports.recordPayment = async (req, res) => {
  try {
    const { method, transactionId } = req.body
    const request = await Request.findOne({ id: req.params.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    request.paymentStatus = method === 'Cash on Pickup' ? 'Cash on Pickup' : 'Paid'
    request.paymentMethod = method
    request.transactionId = transactionId || `TXN${Date.now()}`
    request.status = 'Approved'
    request.statusHistory = pushHistory(request, 'Payment Completed')
    request.statusHistory = pushHistory(request, 'Approved')

    await request.save()
    res.json({ success: true, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update handover status (e.g. Handed Over)
// @route   PUT /api/requests/:id/handover
exports.updateHandover = async (req, res) => {
  try {
    const { status, handoverCode } = req.body
    const request = await Request.findOne({ id: req.params.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    request.handoverStatus = status
    if (handoverCode) request.handoverCode = handoverCode
    if (request.status === 'Pending') request.status = 'Approved'
    request.statusHistory = pushHistory(request, status === 'Handed Over' ? 'Out for Delivery' : status)
    await request.save()

    res.json({ success: true, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Confirm received with 6-digit code
// @route   PUT /api/requests/:id/confirm-code
exports.confirmCode = async (req, res) => {
  try {
    const { code } = req.body
    const request = await Request.findOne({ id: req.params.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    if (request.handoverCode && request.handoverCode !== String(code).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit handover code. Please check with owner.' })
    }

    request.handoverStatus = 'Received'
    if (request.requestType === 'Buy') {
      request.status = 'Completed'
    }
    request.statusHistory = pushHistory(request, 'Item Received by Buyer')
    await request.save()

    res.json({ success: true, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Complete with condition report & refund
// @route   PUT /api/requests/:id/complete-condition
exports.completeWithCondition = async (req, res) => {
  try {
    const { condition, comment, deduction } = req.body
    const request = await Request.findOne({ id: req.params.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    request.status = 'Completed'
    request.handoverStatus = 'Returned'
    request.returnCondition = condition
    request.returnComment = comment
    request.depositDeduction = Number(deduction) || 0
    request.depositRefund = Math.max(0, (request.deposit || 0) - (Number(deduction) || 0))
    request.statusHistory = pushHistory(request, 'Return Confirmed & Completed')

    await request.save()

    // Free up resource bookedRanges
    await Resource.findOneAndUpdate(
      { id: request.resourceId },
      { $pull: { bookedRanges: { requestId: request.id } } }
    )

    res.json({ success: true, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Request rental extension (Active renter priority)
// @route   POST /api/requests/:id/extension
exports.requestExtension = async (req, res) => {
  try {
    const { additionalDays, newEndDate, additionalAmount, reason } = req.body
    const request = await Request.findOne({ id: req.params.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    request.extensionStatus = 'Requested'
    request.extensionDays = additionalDays
    request.extensionEndDate = newEndDate
    request.extensionAmount = additionalAmount
    request.extensionReason = reason
    request.statusHistory = pushHistory(request, 'Extension Requested')

    await request.save()

    // Notify owner
    await Notification.create({
      id: `notif-${Date.now()}`,
      userId: request.ownerId,
      type: 'message',
      title: 'Rental Extension Request',
      desc: `${request.requesterName} requested to extend "${request.resourceTitle}" by ${additionalDays} days (₹${additionalAmount}).`,
      read: false,
    })

    // Send direct chat message to owner
    await Message.create({
      id: `msg-${Date.now()}`,
      resourceId: request.resourceId,
      resourceTitle: request.resourceTitle,
      senderId: request.requesterId,
      senderName: request.requesterName,
      receiverId: request.ownerId,
      receiverName: request.ownerName,
      text: `Hi ${request.ownerName}, I've requested a rental extension for "${request.resourceTitle}" by +${additionalDays} days until ${newEndDate} (Additional fee: ₹${additionalAmount}). Please accept or decline the request.`,
      read: false,
    })

    res.json({ success: true, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Approve rental extension (with conflict detection and bump)
// @route   PUT /api/requests/:id/extension/approve
exports.approveExtension = async (req, res) => {
  try {
    const request = await Request.findOne({ id: req.params.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    if (request.extensionStatus !== 'Requested' && request.extensionStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Extension request has already been processed (one-time decision).' })
    }

    const originalEndDate = request.endDate
    const newEndDate = request.extensionEndDate
    const extensionAmount = request.extensionAmount || 0

    request.endDate = newEndDate
    request.rentalDuration = (request.rentalDuration || 1) + (request.extensionDays || 0)
    request.amount = (request.amount || 0) + extensionAmount
    request.totalAmount = (request.totalAmount || 0) + extensionAmount
    request.extensionStatus = 'Approved'
    request.extensionPaymentStatus = 'Unpaid'
    request.statusHistory = pushHistory(request, 'Extension Approved')

    await request.save()

    // Update resource bookedRanges
    await Resource.findOneAndUpdate(
      { id: request.resourceId, 'bookedRanges.requestId': request.id },
      { $set: { 'bookedRanges.$.end': newEndDate } }
    )

    // Notify renter that extension was approved
    await Notification.create({
      id: `notif-${Date.now()}`,
      userId: request.requesterId,
      type: 'approved',
      title: 'Rental Extension Approved',
      desc: `${request.ownerName} approved your rental extension for "${request.resourceTitle}" until ${newEndDate}. Please pay the extension fee of ₹${extensionAmount}.`,
      read: false,
    })

    // Send confirmation message to renter
    await Message.create({
      id: `msg-${Date.now()}`,
      resourceId: request.resourceId,
      resourceTitle: request.resourceTitle,
      senderId: request.ownerId,
      senderName: request.ownerName,
      receiverId: request.requesterId,
      receiverName: request.requesterName,
      text: `Hi ${request.requesterName}, I have approved your rental extension for "${request.resourceTitle}" until ${newEndDate}. Please complete payment of ₹${extensionAmount} for the additional duration.`,
      read: false,
    })

    // Find and bump any conflicting future bookings (Mutual exclusion: only ONE buyer can be accepted)
    const conflicting = await Request.find({
      id: { $ne: request.id },
      resourceId: request.resourceId,
      status: { $in: ['Pending', 'Approved'] },
      startDate: { $lte: newEndDate },
      endDate: { $gte: originalEndDate },
    })

    for (const conflict of conflicting) {
      conflict.status = 'Rejected'
      conflict.bumpedByExtension = true
      conflict.cancellationReason = 'The product is currently unavailable as the active renter has extended their rental period.'
      conflict.statusHistory = pushHistory(conflict, 'Rejected - Bumped by Active Extension')
      await conflict.save()

      // Remove from resource bookedRanges
      await Resource.findOneAndUpdate(
        { id: request.resourceId },
        { $pull: { bookedRanges: { requestId: conflict.id } } }
      )

      // Notify bumped user
      await Notification.create({
        id: `notif-${Date.now() + Math.random()}`,
        userId: conflict.requesterId,
        type: 'rejected',
        title: 'Product Unavailable (Rental Extended)',
        desc: `"${request.resourceTitle}" is unavailable for your requested dates because the active renter has extended their rental.`,
        read: false,
      })

      // Send apology direct message from seller
      await Message.create({
        id: `msg-${Date.now() + Math.random()}`,
        resourceId: request.resourceId,
        resourceTitle: request.resourceTitle,
        senderId: request.ownerId,
        senderName: request.ownerName,
        receiverId: conflict.requesterId,
        receiverName: conflict.requesterName,
        text: `Hi ${conflict.requesterName}, I apologize, but "${request.resourceTitle}" is currently unavailable because the active renter has extended their rental through ${newEndDate}. Only one booking can be accepted.`,
        read: false,
      })
    }

    res.json({ success: true, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Reject / Decline rental extension
// @route   PUT /api/requests/:id/extension/reject
exports.rejectExtension = async (req, res) => {
  try {
    const { reason } = req.body
    const request = await Request.findOne({ id: req.params.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    if (request.extensionStatus !== 'Requested' && request.extensionStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Extension request has already been processed (one-time decision).' })
    }

    const rejectReason = reason || 'Resource unavailable for extension'
    request.extensionStatus = 'Rejected'
    request.extensionRejectReason = rejectReason
    request.statusHistory = pushHistory(request, 'Extension Declined')
    await request.save()

    // Notify renter
    await Notification.create({
      id: `notif-${Date.now()}`,
      userId: request.requesterId,
      type: 'rejected',
      title: 'Rental Extension Declined',
      desc: `${request.ownerName} could not approve the extension for "${request.resourceTitle}". Reason: ${rejectReason}. Please return by ${request.endDate}.`,
      read: false,
    })

    // Send chat message
    await Message.create({
      id: `msg-${Date.now()}`,
      resourceId: request.resourceId,
      resourceTitle: request.resourceTitle,
      senderId: request.ownerId,
      senderName: request.ownerName,
      receiverId: request.requesterId,
      receiverName: request.requesterName,
      text: `Hi ${request.requesterName}, I am unable to approve the extension for "${request.resourceTitle}". Reason: ${rejectReason}. Please return the item by the original return date (${request.endDate}).`,
      read: false,
    })

    res.json({ success: true, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Record extension payment
// @route   PUT /api/requests/:id/extension/pay
exports.payExtension = async (req, res) => {
  try {
    const { method, transactionId } = req.body
    const request = await Request.findOne({ id: req.params.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    request.extensionPaymentStatus = 'Paid'
    request.extensionPaymentMethod = method
    request.statusHistory = pushHistory(request, 'Extension Fee Paid')
    await request.save()

    // Notify owner that extension fee was paid
    await Notification.create({
      id: `notif-${Date.now()}`,
      userId: request.ownerId,
      type: 'payment',
      title: 'Extension Fee Paid',
      desc: `${request.requesterName} paid ₹${request.extensionAmount} for the rental extension of "${request.resourceTitle}" via ${method}.`,
      read: false,
    })

    // Send direct chat message to owner
    await Message.create({
      id: `msg-${Date.now()}`,
      resourceId: request.resourceId,
      resourceTitle: request.resourceTitle,
      senderId: request.requesterId,
      senderName: request.requesterName,
      receiverId: request.ownerId,
      receiverName: request.ownerName,
      text: `Hi ${request.ownerName}, I have paid the rental extension fee of ₹${request.extensionAmount} via ${method}. Extended until ${request.endDate}.`,
      read: false,
    })

    res.json({ success: true, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
