const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/myteamController");

// GET employee details along with manager and assigned employees
router.get("/:id", employeeController.getEmployeeDetails);

module.exports = router;
