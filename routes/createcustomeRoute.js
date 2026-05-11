const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Adjust the path to your database connection

// Fetch customer details by leadid
router.get('/api/customers/by-lead/:leadid', (req, res) => {
  const leadid = req.params.leadid;

  // Step 1: Fetch customerid from addleads using leadid
  const leadQuery = 'SELECT customerid FROM addleads WHERE leadid = ?';
  db.query(leadQuery, [leadid], (err, leadResults) => {
    if (err) {
      console.error("Error fetching customer ID from leads:", err);
      return res.status(500).json({ message: "Database error." });
    }

    if (leadResults.length === 0) {
      return res.status(404).json({ message: "Lead not found." });
    }

    const customerid = leadResults[0].customerid;

    // Step 2: Fetch customer details from customers table
    const customerQuery = 'SELECT * FROM customers WHERE id = ?';
    db.query(customerQuery, [customerid], (err, customerResults) => {
      if (err) {
        console.error("Error fetching customer data:", err);
        return res.status(500).json({ message: "Database error." });
      }

      if (customerResults.length === 0) {
        return res.status(404).json({ message: "Customer not found." });
      }

      const customerData = customerResults[0];
      res.status(200).json(customerData); // Return customer data
    });
  });
});

module.exports = router;