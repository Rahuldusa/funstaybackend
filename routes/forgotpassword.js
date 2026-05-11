
const express = require('express');
const router = express.Router();
const db = require('../config/db');
router.post("/update-password", async (req, res) => {
  const { email, newpassword, confirmpassword } = req.body;

  // Validate request data
  if (!email || !newpassword || !confirmpassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (newpassword !== confirmpassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // Check if email exists in the database
  const checkEmailQuery = "SELECT * FROM employees WHERE email = ?";

  db.query(checkEmailQuery, [email], async (err, results) => {
    if (err) {
      console.error("Error checking email:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Email does not exist" });
    }

    try {
      // Hash the new password before storing
      const saltRounds = 10; // Salt rounds for bcrypt
      const hashedPassword = await bcrypt.hash(newpassword, saltRounds);

      // Update the password in the database
      const updatePasswordQuery = "UPDATE employees SET password = ?, updated_at = NOW() WHERE email = ?";

      db.query(updatePasswordQuery, [hashedPassword, email], (err, updateResults) => {
        if (err) {
          console.error("Error updating password:", err);
          return res.status(500).json({ message: "Database error" });
        }

        res.status(200).json({ message: "Password updated successfully" });
      });
    } catch (hashError) {
      console.error("Error hashing password:", hashError);
      res.status(500).json({ message: "Error processing password update" });
    }
  });
});

module.exports = router;