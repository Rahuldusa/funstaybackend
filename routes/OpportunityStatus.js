const express = require("express");
const router = express.Router();
const db = require("../config/db");


// ✅ GET all statuses (structured)
router.get("/", (req, res) => {
  const sql = "SELECT * FROM opp_status";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    const primary = results.filter(r => r.is_primary);
    const secondary = results.filter(r => !r.is_primary);

    const formatted = {
      primary: primary.map(p => p.name),
      secondary: {}
    };

    primary.forEach(p => {
      formatted.secondary[p.name] = secondary
        .filter(s => s.parent_id === p.id)
        .map(s => s.name);
    });

    res.json(formatted);
  });
});


router.get("/all", (req, res) => {
  const sql = `
    SELECT 
      ls.id,
      ls.name,
      ls.is_primary,
      ls.parent_id,
      p.name AS parent_name
    FROM opp_status ls
    LEFT JOIN opp_status p ON ls.parent_id = p.id
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    res.json(results);
  });
});


// ✅ CREATE
router.post("/", (req, res) => {
  const { name, is_primary, parent_id } = req.body;

  const sql = `
    INSERT INTO opp_status (name, is_primary, parent_id)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [name, is_primary, parent_id || null], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    res.json({
      message: "Status created",
      id: result.insertId
    });
  });
});


// ✅ UPDATE
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, is_primary, parent_id } = req.body;

  const sql = `
    UPDATE opp_status
    SET name=?, is_primary=?, parent_id=?
    WHERE id=?
  `;

  db.query(sql, [name, is_primary, parent_id || null, id], (err) => {
    if (err) return res.status(500).json({ error: err });

    res.json({ message: "Status updated" });
  });
});


// ✅ DELETE
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM opp_status WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: err });

    res.json({ message: "Status deleted" });
  });
});

module.exports = router;