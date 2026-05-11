const Theme = require("../models/themeModal");

// 🔹 GET: Fetch all available themes
const getThemes = (req, res) => {
  Theme.getAllThemes((err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

// 🔹 GET: Fetch the currently active theme
const getActiveTheme = (req, res) => {
  Theme.getActiveTheme((err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results.length ? results[0] : { color_code: "#ffffff" }); // Default white if no theme set
  });
};

// 🔹 POST: Change the active theme
const setTheme = (req, res) => {
  const { color_name, color_code, category } = req.body;
  
  Theme.setActiveTheme(color_name, color_code, category, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Theme updated successfully" });
  });
};

module.exports = { getThemes, getActiveTheme, setTheme };
