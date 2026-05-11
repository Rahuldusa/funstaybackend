const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/getfunstayemployee', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM addmanager');
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error retrieving managers:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET API to retrieve a manager based on selected id
router.get('/getfunstayemployee/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      // Query to select the manager record based on the id
      const query = 'SELECT * FROM addmanager WHERE id = ?';
      const [rows] = await db.promise().query(query, [id]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Manager not found' });
      }
  
      // Return the manager record
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error('Error fetching manager:', err);
      res.status(500).json({ error: err.message });
    }
  });


  module.exports = router;