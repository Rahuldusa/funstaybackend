const express = require("express");
const router = express.Router();
const db = require("../config/db");


// ✅ GET ALL TEMPLATES
router.get("/", (req, res) => {
  const sql = "SELECT * FROM whatsapp_templates ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    res.json(results);
  });
});


// ✅ GET SINGLE TEMPLATE
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM whatsapp_templates WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    res.json(result[0]);
  });
});


// ✅ CREATE TEMPLATE
router.post("/", (req, res) => {
  const { title, body } = req.body;

  const sql = `
    INSERT INTO whatsapp_templates (title, body)
    VALUES (?, ?)
  `;

  db.query(sql, [title, body], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    res.json({
      message: "Template created",
      id: result.insertId
    });
  });
});


// ✅ UPDATE TEMPLATE
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { title, body } = req.body;

  const sql = `
    UPDATE whatsapp_templates
    SET title=?, body=?
    WHERE id=?
  `;

  db.query(sql, [title, body, id], (err) => {
    if (err) return res.status(500).json({ error: err });

    res.json({ message: "Template updated" });
  });
});


// ✅ DELETE TEMPLATE
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM whatsapp_templates WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: err });

    res.json({ message: "Template deleted" });
  });
});


// ✅ FORMAT MESSAGE (OPTIONAL API)
router.get("/format/:id", (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM whatsapp_templates WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    const t = result[0];

    const formatted = `*${t.title}*\n\n${t.body}`;

    res.json({ message: formatted });
  });
});

module.exports = router;