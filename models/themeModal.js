const db = require("../config/db");

// 🔹 Fetch all available themes
const getAllThemes = (callback) => {
  db.query("SELECT * FROM themes", callback);
};

// 🔹 Fetch the currently active theme
const getActiveTheme = (callback) => {
  db.query("SELECT * FROM themes WHERE is_active = 1 LIMIT 1", callback);
};

// 🔹 Change the active theme (Fix: Prevent duplicates)
const setActiveTheme = (color_name, color_code, category, callback) => {
  // Step 1: Deactivate all previous themes first
  db.query("UPDATE themes SET is_active = 0", (err) => {
    if (err) return callback(err);

    // Step 2: Check if the color with the same category already exists
    db.query(
      "SELECT * FROM themes WHERE color_code = ? AND category = ?",
      [color_code, category],
      (err, results) => {
        if (err) return callback(err);

        if (results.length > 0) {
          // Step 3: If exists, update the existing row to active
          db.query(
            "UPDATE themes SET is_active = 1 WHERE color_code = ? AND category = ?",
            [color_code, category],
            callback
          );
        } else {
          // Step 4: If not exists, insert a new theme
          db.query(
            "INSERT INTO themes (color_name, color_code, category, is_active) VALUES (?, ?, ?, 1)",
            [color_name, color_code, category],
            callback
          );
        }
      }
    );
  });
};

module.exports = { getAllThemes, getActiveTheme, setActiveTheme };
