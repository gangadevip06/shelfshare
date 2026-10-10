// routes/reports.js
const express = require('express')
const router = express.Router()
const { getReports, createReport, updateReportStatus } = require('../controllers/reportController')
const { protect, adminOnly } = require('../middleware/auth')

router.get('/', protect, adminOnly, getReports)
router.post('/', protect, createReport)
router.put('/:id/status', protect, adminOnly, updateReportStatus)

module.exports = router
