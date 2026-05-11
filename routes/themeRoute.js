const express = require("express");
const router = express.Router();
const themeController = require("../controllers/themeController");

// Define routes
router.get("/get-themes", themeController.getThemes);
router.get("/get-active-theme", themeController.getActiveTheme);
router.post("/set-theme", themeController.setTheme);

module.exports = router;
