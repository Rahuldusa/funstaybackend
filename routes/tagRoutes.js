const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Fetch all selected tags
router.get("/gettags", (req, res) => {
  db.query("SELECT * FROM selections", (err, results) => {
    if (err) {
      res.status(500).json({ error: "Database error" });
    } else {
      res.json(
        results.map((row) => ({
          id: row.id,
          tags: row.items.split(", "), // Convert string back to an array
        }))
      );
    }
  });
});

// Save selected tags
router.post("/gettags", (req, res) => {
  const { tags } = req.body;
  if (!tags || !Array.isArray(tags)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  // Extract only labels from the selected tags
  const labels = tags.map((tag) => tag.label).join(", ");

  const sql = "INSERT INTO selections (items) VALUES (?)";
  db.query(sql, [labels], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Tags saved successfully", id: result.insertId });
  });
});

// Fetch all tags for dropdown
router.get("/tags", (req, res) => {
  db.query("SELECT * FROM tags ORDER BY created_at DESC", (err, results) => {
    if (err) {
      res.status(500).json({ error: "Database error" });
    } else {
      res.json(results);
    }
  });
});

// Add a new tag
router.post("/tags", (req, res) => {
  const { value, label } = req.body;
  db.query("INSERT INTO tags (value, label) VALUES (?, ?)", [value, label], (err) => {
    if (err) {
      res.status(500).json({ error: "Failed to insert tag" });
    } else {
      res.json({ message: "Tag added successfully" });
    }
  });
});

// Update an existing tag
router.put("/tags/:id", (req, res) => {
  const { value, label } = req.body;
  const { id } = req.params;
  db.query("UPDATE tags SET value = ?, label = ? WHERE id = ?", [value, label, id], (err) => {
    if (err) {
      res.status(500).json({ error: "Failed to update tag" });
    } else {
      res.json({ message: "Tag updated successfully" });
    }
  });
});

// Delete a tag
router.delete("/tags/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM tags WHERE id = ?", [id], (err) => {
    if (err) {
      res.status(500).json({ error: "Failed to delete tag" });
    } else {
      res.json({ message: "Tag deleted successfully" });
    }
  });
});

module.exports = router;
