// routes/reports.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all reports
router.get('/api/reports', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(rows.map(row => ({
      ...row,
      selectedFields: JSON.parse(row.selected_fields),
      activeFilters: JSON.parse(row.active_filters)
    })));
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Save a new report
router.post('/api/reports', async (req, res) => {
  const { name, description, selectedFields, activeFilters } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Report name is required' });
  }

  try {
    const [result] = await db.promise().query(
      'INSERT INTO reports (name, description, selected_fields, active_filters) VALUES (?, ?, ?, ?)',
      [name, description, JSON.stringify(selectedFields), JSON.stringify(activeFilters)]
    );

    const [newReport] = await db.promise().query('SELECT * FROM reports WHERE id = ?', [result.insertId]);

    res.json({
      ...newReport[0],
      selectedFields: JSON.parse(newReport[0].selected_fields),
      activeFilters: JSON.parse(newReport[0].active_filters)
    });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// Delete a report
router.delete('/api/reports/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.promise().query('DELETE FROM reports WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

module.exports = router;
