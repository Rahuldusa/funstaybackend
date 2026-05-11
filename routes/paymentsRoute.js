const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post("/payments", (req, res) => {
    const { leadid, paid_amount, paid_on, remarks, userid, username, status } = req.body;
  
    // First, get customerid from addleads table
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
  
      // Now insert payment
      const insertQuery = `
        INSERT INTO receivables 
        (leadid, customerid, paid_amount, paid_on, remarks, userid, username, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        insertQuery,
        [leadid, customerid, paid_amount, paid_on, remarks, userid, username, status],
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

  router.put("/payments/:leadid/:paymentid", (req, res) => {
    const { leadid, paymentid } = req.params;
    const { paid_amount, paid_on, remarks, userid, username, status } = req.body;
  
    // First, verify the lead exists and fetch the customerid
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
  
      // Update the payment record
      const updateQuery = `
        UPDATE receivables
        SET
          leadid = ?,
          customerid = ?,
          paid_amount = ?,
          paid_on = ?,
          remarks = ?,
          userid = ?,
          username = ?,
          status = ?
        WHERE id = ?
      `;
  
      db.query(
        updateQuery,
        [leadid, customerid, paid_amount, paid_on, remarks, userid, username, status, paymentid],
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
  

//   router.get("/payments", (req, res) => {
//     const query = "SELECT * FROM receivables";
    
//     db.query(query, (err, results) => {
//       if (err) {
//         return res.status(500).json({ message: "Error fetching receivables", error: err });
//       }
//       res.status(200).json(results);
//     });
//   });

router.get("/payments", (req, res) => {
    const { leadid } = req.query;
    let query = "SELECT * FROM receivables";
    const params = [];
  
    if (leadid) {
      query += " WHERE leadid = ?";
      params.push(leadid);
    }
   query += " ORDER BY created_at DESC"; //chnage to created_At
    db.query(query, params, (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching receivables", error: err });
      }
      res.status(200).json(results);
    });
  });

  router.get('/receivables', (req, res) => {
    const query = `
      SELECT r.*, a.name 
      FROM receivables r
      JOIN addleads a ON r.leadid = a.leadid ORDER BY created_at DESC 
    `; //chnage to created_At
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching receivables with customer names:', err);
        res.status(500).json({ error: 'Database query failed' });
      } else {
        res.json(results);
      }
    });
  });
  

  // Get a single payment by ID
router.get("/payments/:id", (req, res) => {
  const paymentId = req.params.id;
  const query = "SELECT * FROM receivables WHERE id = ?";
  
  db.query(query, [paymentId], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        message: "Error fetching payment", 
        error: err 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        message: "Payment not found" 
      });
    }
    
    res.status(200).json(results[0]);
  });
});

router.put("/update-status/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, approved_by } = req.body;

  // First, check if the payment exists
  const checkQuery = "SELECT * FROM receivables WHERE id = ?";
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error("Error checking payment record:", err);
      return res.status(500).json({ error: "Database error while checking record" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    // Update both status, approved_by and status_updated_at
    const updateQuery = `
      UPDATE receivables 
      SET status = ?, status_updated_at = NOW(), approved_by = ?
      WHERE id = ?
    `;
    db.query(updateQuery, [status, approved_by, id], (err, result) => {
      if (err) {
        console.error("Error updating status:", err);
        return res.status(500).json({ error: "Database error while updating status" });
      }

      res.status(200).json({ message: "Status, approved_by, and update time saved successfully" });
    });
  });
});


  // router.put("/payable-update-status/:id/status", (req, res) => {
  //   const { id } = req.params;
  //   const { status } = req.body;
  
  //   const checkQuery = "SELECT * FROM suppliers WHERE id = ?";
  //   db.query(checkQuery, [id], (err, results) => {
  //     if (err) {
  //       console.error("Error checking payment record:", err);
  //       return res.status(500).json({ error: "Database error while checking record" });
  //     }
  
  //     if (results.length === 0) {
  //       return res.status(404).json({ error: "Payment record not found" });
  //     }
  
  //     // const updateSupplierQuery = "UPDATE suppliers SET status = ? WHERE id = ?";
  //     // db.query(updateSupplierQuery, [status, id], (err) => {
  //     //   if (err) {
  //     //     console.error("Error updating supplier status:", err);
  //     //     return res.status(500).json({ error: "Database error while updating supplier status" });
  //     //   }
  
  //       const updateLogQuery = "UPDATE payment_log SET status = ? WHERE supplier_id = ?";
  //       db.query(updateLogQuery, [status, id], (err) => {
  //         if (err) {
  //           console.error("Error updating payment_log status:", err);
  //           return res.status(500).json({ error: "Database error while updating log status" });
  //         }
  
  //         res.status(200).json({ message: "Status updated in both suppliers and payment_log" });
  //       });
  //     });
  //   });
  
  // PUT /api/suppliers/history/:id/status

  router.put('/suppliers/history/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
  
    try {
      const query = `
        UPDATE payment_log 
        SET status = ?, status_updated_at = NOW() 
        WHERE id = ?
      `;
      await db.promise().query(query, [status, id]);
  
      res.status(200).json({ message: 'Status and timestamp updated successfully' });
    } catch (err) {
      console.error('DB Update Error:', err);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });
  
  
  //   const checkQuery = "SELECT * FROM suppliers WHERE id = ?";
  //   db.query(checkQuery, [id], (err, results) => {
  //     if (err) {
  //       console.error("Error checking payment record:", err);
  //       return res.status(500).json({ error: "Database error while checking record" });
  //     }
  
  //     if (results.length === 0) {
  //       return res.status(404).json({ error: "Payment record not found" });
  //     }
  
  //     // const updateSupplierQuery = "UPDATE suppliers SET status = ? WHERE id = ?";
  //     // db.query(updateSupplierQuery, [status, id], (err) => {
  //     //   if (err) {
  //     //     console.error("Error updating supplier status:", err);
  //     //     return res.status(500).json({ error: "Database error while updating supplier status" });
  //     //   }
  
  //       const updateLogQuery = "UPDATE payment_log SET status = ? WHERE supplier_id = ?";
  //       db.query(updateLogQuery, [status, id], (err) => {
  //         if (err) {
  //           console.error("Error updating payment_log status:", err);
  //           return res.status(500).json({ error: "Database error while updating log status" });
  //         }
  
  //         res.status(200).json({ message: "Status updated in both suppliers and payment_log" });
  //       });
  //     });
  //   });
  
  // PUT /api/suppliers/history/:id/status

  router.put('/suppliers/history/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
  
    try {
      await db.promise().query('UPDATE payment_log SET status = ? WHERE id = ?', [status, id]);
      res.status(200).json({ message: 'Status updated successfully' });
    } catch (err) {
      console.error('DB Update Error:', err);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  router.delete('/delete/receivables/:id', (req, res) => {
    const id = req.params.id;
  
    const deleteQuery = 'DELETE FROM receivables WHERE id = ?';
  
    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error('Error deleting receivable:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete receivable.' });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Receivable not found.' });
      }
  
      return res.json({ success: true, message: 'Receivable deleted successfully.' });
    });
  });
  
  module.exports = router;