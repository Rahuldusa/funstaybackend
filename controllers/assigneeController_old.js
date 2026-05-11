// controllers/assigneeController.js
const assigneeModel = require('../models/assigneeModel');


const db = require('../config/db');

const updateAssignee = (req, res) => {
  const {leadid, assignee, managerid } = req.body;
  
 

  const query = `
    UPDATE addleads 
    SET managerid = ?, assign_to_manager = ? 
    WHERE leadid = ?
  `;

  db.query(query, [managerid ,assignee,  leadid], (error, results) => {
    if (error) {
      console.error("Error assigning lead:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.status(200).json({ message: "Lead assigned successfully" });
  });
};

module.exports = { updateAssignee };
