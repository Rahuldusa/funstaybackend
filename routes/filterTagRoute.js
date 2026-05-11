const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import your database connection


// Fetch customers based on tag match in travel_opportunity table
router.get('/tagfilter', async (req, res) => {
  try {
      const { tag } = req.query;

      if (!tag) {
          return res.status(400).json({ error: 'Tag parameter is required' });
      }

      // Query to get customer IDs based on tag match in travel_opportunity
      const tagQuery = `
          SELECT DISTINCT customerid 
          FROM travel_opportunity 
          WHERE tag = ?;
      `;

      db.query(tagQuery, [tag], (err, tagResults) => {
          if (err) {
              console.error('Error fetching customer IDs:', err);
              return res.status(500).json({ error: 'Database error' });
          }

          if (tagResults.length === 0) {
              return res.status(200).json([]); // No matching customers
          }

          const customerIds = tagResults.map(row => row.customerid);

          // Query to fetch customer details based on retrieved IDs
          const customerQuery = `
              SELECT id, name, phone_number, email, customer_status 
              FROM customers 
              WHERE id IN (?);
          `;

          db.query(customerQuery, [customerIds], (err, customerResults) => {
              if (err) {
                  console.error('Error fetching customer details:', err);
                  return res.status(500).json({ error: 'Database error' });
              }
              res.status(200).json(customerResults);
          });
      });

  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
