const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create a new supplier entry
router.post('/api/suppliers', async (req, res) => {
  try {
    const { leadid, supplierlist_id, supplier_name, total_payable, paid_on, paid_amount, comments, userid, username } = req.body;
    
    const query = `
      INSERT INTO suppliers 
      (leadid, supplierlist_id, supplier_name, total_payable, paid_on, paid_amount, comments, userid, username, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    
    const [result] = await db.query(query, 
      [leadid, supplierlist_id, supplier_name, total_payable, paid_on, paid_amount, comments, userid, username]);
    
    res.status(201).json({ id: result.insertId, message: 'Supplier entry created successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get balance amount (sum of paid amounts) for leadid and supplierlist_id
router.get('/api/suppliers/balance/:leadid/:supplierlist_id', async (req, res) => {
  try {
    const { leadid, supplierlist_id } = req.params;
    
    const query = `
      SELECT 
        COALESCE(SUM(paid_amount), 0) as total_paid,
        (SELECT total_payable FROM suppliers WHERE leadid = ? AND supplierlist_id = ? LIMIT 1) as total_payable
      FROM suppliers 
      WHERE leadid = ? AND supplierlist_id = ?
    `;
    
    const [results] = await db.query(query, [leadid, supplierlist_id, leadid, supplierlist_id]);
    
    const balance = (results[0].total_payable || 0) - (results[0].total_paid || 0);
    res.json({
      total_payable: results[0].total_payable || 0,
      total_paid: results[0].total_paid || 0,
      balance: balance
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all history for a specific leadid and supplierlist_id
router.get('/api/suppliers/history/:leadid/:supplierlist_id', async (req, res) => {
  try {
    const { leadid, supplierlist_id } = req.params;
    
    const query = `
      SELECT * FROM suppliers 
      WHERE leadid = ? AND supplierlist_id = ?
      ORDER BY created_At DESC
    `;
    
    const [results] = await db.query(query, [leadid, supplierlist_id]);
    res.json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get a specific supplier entry by ID
router.get('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT * FROM suppliers WHERE id = ?';
    
    const [results] = await db.query(query, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Supplier entry not found' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a supplier entry
router.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { leadid, supplierlist_id, supplier_name, total_payable, paid_on, paid_amount, comments, status, approved_by } = req.body;
    
    let query, params;
    
    if (status && status.toLowerCase() === 'approved') {
      query = `
        UPDATE suppliers 
        SET leadid = ?, supplierlist_id = ?, supplier_name = ?, total_payable = ?, 
            paid_on = ?, paid_amount = ?, comments = ?, status = ?, 
            approved_by = ?, approved_At = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      params = [leadid, supplierlist_id, supplier_name, total_payable, paid_on, 
                paid_amount, comments, status, approved_by, id];
    } else {
      query = `
        UPDATE suppliers 
        SET leadid = ?, supplierlist_id = ?, supplier_name = ?, total_payable = ?, 
            paid_on = ?, paid_amount = ?, comments = ?, status = ?
        WHERE id = ?
      `;
      params = [leadid, supplierlist_id, supplier_name, total_payable, paid_on, 
                paid_amount, comments, status, id];
    }
    
    const [result] = await db.query(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Supplier entry not found' });
    }
    res.json({ message: 'Supplier entry updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a supplier entry
router.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM suppliers WHERE id = ?';
    
    const [result] = await db.query(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Supplier entry not found' });
    }
    res.json({ message: 'Supplier entry deleted successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;