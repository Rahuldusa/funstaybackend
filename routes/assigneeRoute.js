// routes/assigneeRoutes.js
const express = require('express');
const router = express.Router();
const assigneeController = require('../controllers/assigneeController');
const { updateAssignee } = require('../controllers/assigneeController');

// Define the route and map it to the controller
router.put('/update-assignee', updateAssignee);
router.get('/associates/:managerid', assigneeController.getAssociates);

module.exports = router;
