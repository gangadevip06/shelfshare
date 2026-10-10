// models/Request.js
const mongoose = require('mongoose')

const HistoryItemSchema = new mongoose.Schema({
  key: String,
  at: String,
})

const RequestSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    resourceId: { type: String, required: true },
    resourceTitle: { type: String, required: true },
    requesterId: { type: String, required: true },
    requesterName: { type: String, required: true },
    ownerId: { type: String, required: true },
    ownerName: { type: String, required: true },
    requestType: { type: String, enum: ['Rent', 'Buy'], default: 'Rent' },
    rentalDuration: { type: Number, default: 1 },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    isPreBooking: { type: Boolean, default: false },
    quantity: { type: Number, default: 1 },
    amount: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    pickupLocation: { type: String, default: null },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'], default: 'Pending' },
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Cash on Pickup'], default: 'Unpaid' },
    paymentMethod: { type: String, default: null },
    transactionId: { type: String, default: null },
    handoverStatus: { type: String, enum: ['Not Handed Over', 'Handed Over', 'Received', 'Returned'], default: 'Not Handed Over' },
    handoverCode: { type: String, default: null },
    returnCondition: { type: String, default: null },
    returnComment: { type: String, default: null },
    depositDeduction: { type: Number, default: 0 },
    depositRefund: { type: Number, default: null },
    // Rental Extension fields
    extensionStatus: { type: String, default: null }, // 'Requested', 'Approved', 'Rejected'
    extensionDays: { type: Number, default: null },
    extensionEndDate: { type: String, default: null },
    extensionAmount: { type: Number, default: null },
    extensionReason: { type: String, default: null },
    extensionPaymentStatus: { type: String, default: null },
    extensionPaymentMethod: { type: String, default: null },
    extensionRejectReason: { type: String, default: null },
    bumpedByExtension: { type: Boolean, default: false },
    cancellationReason: { type: String, default: null },
    statusHistory: [HistoryItemSchema],
    message: { type: String, default: '' },
    requestedOn: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Request', RequestSchema)
