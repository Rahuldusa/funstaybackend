// models/assigneeModel.js
const db = require('../config/db'); // Import the database connection

const updateAssignee = async (leadid, assignee, managerid) => {
  // Update both `assign_to_manager` and `managerid` fields in the `addleads` table
  const query = `UPDATE addleads SET assign_to_manager = ?, managerid = ? WHERE leadid = ?`;
  const [result] = await db.promise().execute(query, [managerid, assignee, leadid]);
  return result;
};

module.exports = { updateAssignee };

