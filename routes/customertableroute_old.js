const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Adjust the path to your database connection

// Fetch all customers
router.get('/api/customers', (req, res) => {
  const query = 'SELECT * FROM customers';

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching customers:", err);
      return res.status(500).json({ message: "Database error." });
    }

    res.status(200).json(results); // Return all customer data
  });
});

// Fetch a customer by ID
router.get('/api/customers/:id', (req, res) => {
  const customerId = req.params.id;
  const query = 'SELECT * FROM customers WHERE id = ?';

  db.query(query, [customerId], (err, results) => {
    if (err) {
      console.error("Error fetching customer:", err);
      return res.status(500).json({ message: "Database error." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Customer not found." });
    }

    res.status(200).json(results[0]); // Return the specific customer data
  });
});

module.exports = router;