// models/Transaction.js
const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    requestId: { type: String, required: true },
    resourceId: { type: String, required: true },
    payerId: { type: String, required: true },
    receiverId: { type: String, required: true },
    amount: { type: Number, required: true },
    deposit: { type: Number, default: 0 },
    paymentMethod: { type: String, required: true },
    transactionId: { type: String, default: null },
    status: { type: String, default: 'Success' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Transaction', TransactionSchema)
