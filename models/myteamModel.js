const db = require("../config/db");

// Fetch employee details by ID
async function getEmployeeById(id) {
  const [rows] = await db.promise().query("SELECT assign_manager, managerId FROM employees WHERE id = ?", [id]);
  return rows.length ? rows[0] : null;
}

// Fetch manager details by ID
async function getManagerById(managerId) {
  const [rows] = await db.promise().query("SELECT id, name, email, mobile FROM employees WHERE id = ?", [managerId]);
  return rows.length ? rows[0] : null;
}

// // Fetch all employees assigned to a manager
// async function getEmployeesByManager(managerId) {
//   const [rows] = await db.promise().query("SELECT id, name, mobile FROM employees WHERE managerId = ?", [managerId]);
//   return rows;
// }

// Fetch all employees assigned to a manager
async function getEmployeesByManager(managerId) {
    const [rows] = await db.promise().query(
      "SELECT id, name, mobile, email FROM employees WHERE managerId = ?", 
      [managerId]
    );
    return rows;
  }

module.exports = { getEmployeeById, getManagerById, getEmployeesByManager };