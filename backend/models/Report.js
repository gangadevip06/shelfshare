// models/Report.js
const mongoose = require('mongoose')

const ReportSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    resourceId: { type: String, required: true },
    resourceTitle: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    reason: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Open', 'Under Review', 'Resolved', 'Dismissed'], default: 'Open' },
    createdAt: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Report', ReportSchema)
