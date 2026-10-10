// controllers/reportController.js
const Report = require('../models/Report')

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 })
    res.json({ success: true, count: reports.length, data: reports })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.createReport = async (req, res) => {
  try {
    const reportId = `rep-${Date.now()}`
    const newReport = await Report.create({
      ...req.body,
      id: reportId,
      status: 'Open',
      createdAt: new Date().toISOString().slice(0, 10),
    })
    res.status(201).json({ success: true, data: newReport })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body
    const report = await Report.findOneAndUpdate({ id: req.params.id }, { status }, { new: true })
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' })
    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
