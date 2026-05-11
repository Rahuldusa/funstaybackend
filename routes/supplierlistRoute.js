const express = require("express");
const router = express.Router();
const db = require("./../config/db");



// POST API to add a new supplier
router.post('/addsupplierlist', (req, res) => {
    const {
        supplierName,
        companyName,
        contactPerson,
        phone,
        email,
        address
    } = req.body;

    // Validate required fields
    if (!supplierName || !companyName || !contactPerson) {
        return res.status(400).json({
            success: false,
            message: 'Supplier Name, Company Name, and Contact Person are required fields'
        });
    }

    const insertQuery = `
    INSERT INTO supplierlist (
        supplierName,
        companyName,
        contactPerson,
        phone,
        email,
        address
    ) VALUES (?, ?, ?, ?, ?, ?)`;

    const values = [
        supplierName,
        companyName,
        contactPerson,
        phone || null,
        email || null,
        address || null   
    ];

    db.query(insertQuery, values, (err, results) => {
        if (err) {
            console.error('Error adding supplier:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to add supplier',
                error: err.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Supplier added successfully',
            supplierId: results.insertId
        });
    });
});

// GET API to retrieve all suppliers
router.get('/supplierslist', (req, res) => {
    const query = 'SELECT * FROM supplierlist ORDER BY createdAt DESC';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching suppliers:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch suppliers',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    });
});

// GET API to retrieve a single supplier by ID
router.get('/supplierslist/:id', (req, res) => {
    const supplierId = req.params.id;
    const query = 'SELECT * FROM supplierlist WHERE id = ?';

    db.query(query, [supplierId], (err, results) => {
        if (err) {
            console.error('Error fetching supplier:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch supplier',
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        res.status(200).json({
            success: true,
            data: results[0]
        });
    });
});



router.delete("/deletesupplier/:id", (req, res) => {
    const supplierId = req.params.id;
  
    const sql = "DELETE FROM supplierlist WHERE id = ?";
    db.query(sql, [supplierId], (err, result) => {
      if (err) {
        console.error("Error deleting supplier:", err);
        return res.status(500).json({ success: false, message: "Failed to delete supplier" });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Supplier not found" });
      }
  
      res.status(200).json({ success: true, message: "Supplier deleted successfully" });
    });
  });
  

  router.get("/suppliernames", (req, res) => {
    const query = "SELECT id, supplierName FROM supplierlist";
    db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ data: results });
    });
  });


  router.put('/edit-supplierslist/:id', (req, res) => {
    const id = req.params.id;
    const {
      supplierName,
      companyName,
      contactPerson,
      phone,
      email,
      address,
    } = req.body;
  
    const sql = `
      UPDATE supplierlist 
      SET 
        supplierName = ?, 
        companyName = ?, 
        contactPerson = ?, 
        phone = ?, 
        email = ?, 
        address = ?
      WHERE id = ?
    `;
  
    db.query(
      sql,
      [supplierName, companyName, contactPerson, phone, email, address, id],
      (err, result) => {
        if (err) {
          console.error('Error updating supplier:', err);
          return res.status(500).json({ success: false, message: 'Database error' });
        }
  
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Supplier not found' });
        }
  
        res.json({ success: true, message: 'Supplier updated successfully' });
      }
    );
  });
  
  

module.exports = router;