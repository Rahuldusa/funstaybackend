const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post("/payments", (req, res) => {
    const { leadid, paid_amount, paid_on, remarks, userid } = req.body;
  
    const getLeadQuery = "SELECT customerid FROM addleads WHERE leadid = ?";
    db.query(getLeadQuery, [leadid], (err, results) => {
      if (err) {
        console.error("Error fetching customerid:", err);
        return res.status(500).json({ error: "Error fetching lead info" });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: "Lead not found" });
      }
  
      const customerid = results[0].customerid;
  
      const insertQuery = `
        INSERT INTO receivablenew 
        (leadid, customerid, paid_amount, paid_on, remarks, userid, status) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `;
      db.query(
        insertQuery,
        [leadid, customerid, paid_amount, paid_on, remarks, userid],
        (err, result) => {
          if (err) {
            console.error("Error inserting payment:", err);
            return res.status(500).json({ error: "Database error" });
          }
          res.status(200).json({ message: "Payment saved successfully" });
        }
      );
    });
  });
  router.get("/payments", (req, res) => {
    const { leadid } = req.query;
    let query = "SELECT * FROM receivables";
    const params = [];
  
    if (leadid) {
      query += " WHERE leadid = ?";
      params.push(leadid);
    }
  
    db.query(query, params, (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching receivables", error: err });
      }
      res.status(200).json(results);
    });
  });
  
  // GET: Retrieve payments by leadid

  
  // PUT: Update an existing payment
  router.put("/payments/:leadid/:paymentid", (req, res) => {
    const { leadid, paymentid } = req.params;
    const { paid_amount, paid_on, remarks, userid } = req.body;
  
    const getLeadQuery = "SELECT customerid FROM addleads WHERE leadid = ?";
    db.query(getLeadQuery, [leadid], (err, results) => {
      if (err) {
        console.error("Error fetching lead:", err);
        return res.status(500).json({ error: "Error fetching lead info" });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: "Lead not found" });
      }
  
      const customerid = results[0].customerid;
  
      const updateQuery = `
        UPDATE receivablenew
        SET
          leadid = ?,
          customerid = ?,
          paid_amount = ?,
          paid_on = ?,
          remarks = ?,
          userid = ?,
          status = 'pending'
        WHERE id = ?
      `;
  
      db.query(
        updateQuery,
        [leadid, customerid, paid_amount, paid_on, remarks, userid, paymentid],
        (err, result) => {
          if (err) {
            console.error("Error updating payment:", err);
            return res.status(500).json({ error: "Database error" });
          }
  
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Payment not found" });
          }
  
          res.status(200).json({ message: "Payment updated successfully" });
        }
      );
    });
  });
  module.exports = router;