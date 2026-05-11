const express = require('express');
const router = express.Router();
const db = require('../config/db');


router.get("/getdestinations", (req, res) => {
    db.query("SELECT * FROM selections", (err, results) => {
      if (err) {
        res.status(500).json({ error: "Database error" });
      } else {
        res.json(
          results.map((row) => ({
            id: row.id,
            items: row.items.split(", "), // Convert string back to array
          }))
        );
      }
    });
  });
  
  
  router.post("/getdestinations", (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid data format" });
    }
  
    // Extract only labels from the selected items
    const labels = items.map((item) => item.label).join(", ");
  
    const sql = "INSERT INTO selections (items) VALUES (?)";
    db.query(sql, [labels], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Data saved successfully", id: result.insertId });
    });
  });
  
  
  // Fetch dropdown options from MySQL
  router.get("/destinations", (req, res) => {
    db.query("SELECT * FROM options ORDER BY created_at DESC", (err, results) => {
      if (err) {
        res.status(500).json({ error: "Database error" });
      } else {
        res.json(results);
      }
    });
  });
  
  // Add a new option to the MySQL table
  router.post("/destinations", (req, res) => {
    const { value, label } = req.body;
    db.query("INSERT INTO options (value, label) VALUES (?, ?)", [value, label], (err) => {
      if (err) {
        res.status(500).json({ error: "Failed to insert option" });
      } else {
        res.json({ message: "Option added successfully" });
      }
    });
  });

  router.put("/destinations/:id", (req, res) => {
    const { value, label } = req.body;
    const { id } = req.params;
    db.query("UPDATE options SET value = ?, label = ? WHERE id = ?", [value, label, id], (err) => {
      if (err) {
        res.status(500).json({ error: "Failed to update destination" });
      } else {
        res.json({ message: "Destination updated successfully" });
      }
    });
});

router.delete("/destinations/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM options WHERE id = ?", [id], (err) => {
      if (err) {
        res.status(500).json({ error: "Failed to delete destination" });
      } else {
        res.json({ message: "Destination deleted successfully" });
      }
    });
});


  
  module.exports = router;  