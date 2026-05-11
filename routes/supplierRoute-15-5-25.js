
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/suppliers', (req, res) => {
  const { leadid } = req.query;
  
  if (!leadid) {
      return res.status(400).json({ error: 'leadid parameter is required' });
  }

  const query = 'SELECT * FROM suppliers WHERE leadid = ?  ORDER BY createdAt DESC';
  
  db.query(query, [leadid], (err, results) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to fetch suppliers' });
      }
      res.json(results);
  });
});

router.get('/approval/suppliers', (req, res) => {
  const query = `
    SELECT s.*, a.name
    FROM suppliers s
    JOIN addleads a ON s.leadid = a.leadid
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching suppliers with customer names:', err);
      res.status(500).json({ error: 'Database query failed' });
    } else {
      res.json(results);
    }
  });
});

  
router.get('/suppliers/:id/history', (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT id, supplier_id, paid_amount, paid_on, next_payment, status FROM payment_log WHERE supplier_id = ? ORDER BY createdAt DESC',
    [id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch history' });
      }
      res.json(results);
    }
  );
});

router.get('/edit-payment-log/:id', (req, res) => {
  const paymentId = req.params.id;

  const sql = `
    SELECT 
      p.*, 
      s.total_payable 
    FROM 
      payment_log p 
    JOIN 
      suppliers s 
    ON 
      p.supplier_id = s.id 
    WHERE 
      p.id = ?
  `;

  db.query(sql, [paymentId], (err, results) => {
    if (err) {
      console.error('Error fetching payment log by ID with supplier details:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Payment log not found' });
    }

    res.status(200).json({ data: results[0] });
  });
});
 
  router.post('/suppliers', (req, res) => {
    const {
      supplierId,
      supplierName,
      totalPayable,
      paidOn,
      paidAmount,
      // balancePayment,
      comments,
      // nextPayment,
      // purposeOfPayment,
      leadId,  // Add leadId to destructured fields
      userid,
      username,
      status,

    } = req.body;
  
    const insertSupplier = `
      INSERT INTO suppliers 
      (supplierlist_id,supplier_name, total_payable, paid_on, comments, leadid,
      userid, username, status)
      VALUES (?,?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    db.query(
      insertSupplier,
      [
        supplierId,
        supplierName, 
        totalPayable, 
        paidOn, 
        // paidAmount, 
        // balancePayment, 
        comments, 
        // nextPayment,
        // purposeOfPayment,
        leadId,  // Add leadId to the values array
        userid,
        username,
        status
      ],
      (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to add supplier' });
        }
  
        // Insert into history
        const insertHistory = `
          INSERT INTO payment_log 
          (supplier_id, paid_amount, paid_on, leadid, userid, username, status,comments)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const newsupplierId = result.insertId;
  
        db.query(
          insertHistory,
          [newsupplierId, paidAmount, paidOn, leadId, userid, username, status,comments],  // Add leadId here
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
  const { paidAmount, leadid, comments, userid, username, status,paidOn } = req.body;
  console.log("paidAmount=",req.body);
  console.log("leadid=",leadid);
  const now = new Date();
const formattedNow = now.toISOString().slice(0, 19).replace('T', ' '); // Ensure `now` is defined

  const insertHistory = `
    INSERT INTO payment_log 
    (supplier_id, paid_amount, paid_on, comments, leadid, userid, username, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertHistory, 
    [supplierId, paidAmount, paidOn, comments, leadid, userid, username, status],
    (logErr) => {
      if (logErr) {
        console.error('Error logging payment:', logErr);
        return res.status(500).json({ error: 'Failed to log payment' });
      }

      res.json({
        message: 'Payment logged successfully',
      });
    }
  );
});


router.get('/payment-log', (req, res) => {
  const { leadid, supplier_id } = req.query;

  if (!leadid || !supplier_id) {
    return res.status(400).json({ message: 'Missing leadid or supplier_id' });
  }

  const sql = `SELECT SUM(paid_amount) AS total_paid FROM payment_log WHERE leadid = ? AND supplier_id = ?`;

  db.query(sql, [leadid, supplier_id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json({ total_paid: results[0].total_paid || 0 });
  });
});

router.get('/payment-log-history', (req, res) => {
  const { supplier_id } = req.query;

  if (!supplier_id) {
    return res.status(400).json({ message: 'Missing leadid or supplier_id in query parameters.' });
  }

  const sql = `SELECT * FROM payment_log WHERE supplier_id = ? ORDER BY createdAt DESC`;

  db.query(sql, [ supplier_id], (err, results) => {
    if (err) {
      console.error('Error fetching payment log:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    res.status(200).json({ data: results });
  });
});

router.put('/update-suppliers-payment/:id', (req, res) => {
  const paymentId = req.params.id;
  const {
    paidAmount,
    paidOn,
    comments,
    userid,
    username,
    status
  } = req.body;

  const sql = `
    UPDATE payment_log 
    SET 
      paid_amount = ?, 
      paid_on = ?, 
      comments = ?, 
      userid = ?, 
      username = ?, 
      status = ?
    WHERE id = ?
  `;

  const values = [paidAmount, paidOn, comments, userid, username, status, paymentId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating payment log:', err);
      return res.status(500).json({ message: 'Failed to update payment log', error: err });
    }

    res.status(200).json({ message: 'Payment log updated successfully' });
  });
});

router.delete("/supplier-payments/:id", (req, res) => {
  const paymentId = req.params.id;
  const query = "DELETE FROM payment_log WHERE id = ?";

  db.query(query, [paymentId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Error deleting payment",
        error: err,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    res.status(200).json({
      message: "Payment deleted successfully",
    });
  });
});

// Update total_payable for a supplier
router.put('/Total-amount/:supplierId', (req, res) => {
  const { supplierId } = req.params;
  const { total_payable } = req.body;

  if (!supplierId || isNaN(supplierId)) {
    return res.status(400).json({ success: false, message: 'Invalid supplier ID' });
  }

  if (total_payable === undefined || isNaN(total_payable)) {
    return res.status(400).json({ success: false, message: 'Invalid total payable amount' });
  }

  const query = 'UPDATE suppliers SET total_payable = ? WHERE id = ?';

  db.query(query, [total_payable, supplierId], (err, result) => {
    if (err) {
      console.error('Error updating supplier:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, message: 'Total payable updated successfully' });
  });
});

router.get('/payment-summary', (req, res) => {
  const { leadid, supplier_id } = req.query;

  let sql = '';
  let params = [];

  if (leadid && supplier_id) {
    sql = `
      SELECT leadid, supplier_id, SUM(paid_amount) AS total_paid
      FROM payment_log
      WHERE leadid = ? AND supplier_id = ?
      GROUP BY leadid, supplier_id
    `;
    params = [leadid, supplier_id];
  } else {
    sql = `
      SELECT leadid, supplier_id, SUM(paid_amount) AS total_paid
      FROM payment_log
      GROUP BY leadid, supplier_id
    `;
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    res.json(results);
  });
});

// Start 

router.get('/payment-log-content', (req, res) => {
  const sql = 'SELECT * FROM payment_log ORDER BY createdAt DESC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching payment_log:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

router.get('/payment-logs-with-details', async (req, res) => {
  try {
    const query = `
      SELECT 
        pl.*,
        s.supplier_name,
        al.name AS customer_name
      FROM 
        payment_log pl
      LEFT JOIN 
        suppliers s ON pl.leadid = s.leadid AND pl.supplier_id = s.id
      LEFT JOIN 
        addleads al ON pl.leadid = al.leadid
      WHERE 
        pl.status = 'Pending'
        ORDER BY 
        pl.createdAt DESC
    `;
    
    // Using promise() wrapper
    const [results] = await db.promise().query(query);
    res.json(results);
    
  } catch (error) {
    console.error('Error fetching payment logs with details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/payment-logs/:id/supplierstatus', (req, res) => {
  const { id } = req.params;
  const { status, approved_by } = req.body;
  const status_updated_at = new Date();

  const updateSql = `
    UPDATE payment_log 
    SET status = ?, approved_by = ?, status_updated_at = ?
    WHERE id = ?
  `;

  db.query(updateSql, [status, approved_by, status_updated_at, id], (err, result) => {
    if (err) {
      console.error('Error updating payment log status:', err);
      return res.status(500).json({ error: 'Database error during update' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment log not found' });
    }

    const selectSql = `SELECT * FROM payment_log WHERE id = ?`;
    db.query(selectSql, [id], (err, rows) => {
      if (err) {
        console.error('Error fetching updated payment log:', err);
        return res.status(500).json({ error: 'Database error during fetch' });
      }
      res.json(rows[0]);
    });
  });
});

router.get('/paid-suppliers', (req, res) => {
  const { leadid } = req.query;

  if (!leadid) {
    return res.status(400).json({ error: 'leadid is required' });
  }

  const selectSql = `SELECT DISTINCT supplierlist_id, supplier_name 
FROM suppliers 
WHERE leadid = ? ORDER BY createdAt DESC`;

  db.query(selectSql, [leadid], (err, results) => {
    if (err) {
      console.error('Error fetching paid suppliers:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json({ data: results }); // results = [{ supplier_id: 1 }, ...]
  });
});








 module.exports = router;