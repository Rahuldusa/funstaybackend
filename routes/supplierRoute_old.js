
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/suppliers', (req, res) => {
  const { leadid } = req.query;
  
  if (!leadid) {
      return res.status(400).json({ error: 'leadid parameter is required' });
  }

  const query = 'SELECT * FROM suppliers WHERE leadid = ?';
  
  db.query(query, [leadid], (err, results) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to fetch suppliers' });
      }
      res.json(results);
  });
});
  
  // GET supplier payment history
  router.get('/suppliers/:id/history', (req, res) => {
    const { id } = req.params;
    db.query(
      'SELECT paid_amount, paid_on, next_payment FROM payment_log WHERE supplier_id = ? ORDER BY paid_on DESC',
      [id],
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch history' });
        }
        res.json(results);
      }
    );
  });
  
 
  router.post('/suppliers', (req, res) => {
    const {
      supplierName,
      totalPayable,
      paidOn,
      paidAmount,
      balancePayment,
      comments,
      nextPayment,
      leadId  // Add leadId to destructured fields
    } = req.body;
  
    const insertSupplier = `
      INSERT INTO suppliers 
      (supplier_name, total_payable, paid_on, paid_amount, balance_payment, comments, next_payment, leadid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    db.query(
      insertSupplier,
      [
        supplierName, 
        totalPayable, 
        paidOn, 
        paidAmount, 
        balancePayment, 
        comments, 
        nextPayment,
        leadId  // Add leadId to the values array
      ],
      (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to add supplier' });
        }
  
        // Insert into history
        const insertHistory = `
          INSERT INTO payment_log 
          (supplier_id, paid_amount, paid_on, next_payment, leadid)
          VALUES (?, ?, ?, ?, ?)
        `;
        const supplierId = result.insertId;
  
        db.query(
          insertHistory,
          [supplierId, paidAmount, paidOn, nextPayment, leadId],  // Add leadId here
          (historyErr) => {
            if (historyErr) {
              console.error('History log failed:', historyErr);
            }
          }
        );
  
        res.status(201).json({ 
          message: 'Supplier added successfully',
          supplierId: supplierId
        });
      }
    );
});


router.post('/suppliers/:id/payment', (req, res) => {
  const supplierId = req.params.id;
  const { paidAmount, nextPayment, leadId } = req.body; // Add leadId to destructuring

  const getSupplier = 'SELECT paid_amount, balance_payment, leadid FROM suppliers WHERE id = ?';

  db.query(getSupplier, [supplierId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ error: 'Supplier not found' });
    }

    const supplier = results[0];
    const oldPaid = parseFloat(supplier.paid_amount || 0);
    const oldBalance = parseFloat(supplier.balance_payment || 0);
    const newPaid = oldPaid + parseFloat(paidAmount);
    const newBalance = Math.max(oldBalance - parseFloat(paidAmount), 0);
    const now = new Date();
    const effectiveLeadId = leadId || supplier.leadid; // Use new leadId or existing one

    const updateQuery = `
      UPDATE suppliers 
      SET paid_amount = ?, balance_payment = ?, next_payment = ?, paid_on = ?, leadid = ?
      WHERE id = ?
    `;

    db.query(
      updateQuery,
      [newPaid, newBalance, nextPayment, now, effectiveLeadId, supplierId],
      (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ error: 'Failed to update payment' });
        }

        // Insert history with leadid
        const insertHistory = `
          INSERT INTO payment_log 
          (supplier_id, paid_amount, paid_on, next_payment, leadid)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
          insertHistory, 
          [supplierId, paidAmount, now, nextPayment, effectiveLeadId],
          (logErr) => {
            if (logErr) {
              console.error('Error logging payment:', logErr);
            }

            res.json({
              message: 'Payment updated successfully',
              updated: {
                paidAmount: newPaid,
                balancePayment: newBalance,
                leadId: effectiveLeadId
              }
            });
          }
        );
      }
    );
  });
});

 module.exports = router;