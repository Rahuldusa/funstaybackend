const db = require('../config/db');




const getManagerById = async (managerId) => {
    const query = 'SELECT id, name FROM employees WHERE id = ? AND role = "manager"';
    const [result] = await db.promise().query(query, [managerId]);
    return result.length > 0 ? result[0] : null;  // Return manager if exists
  };
  
  // Register employee
  const registerEmployee = async (employeeData) => {
    const { name, mobile, email, password, role, managerName, managerId } = employeeData;
    const query = `
      INSERT INTO employees (name, mobile, email, password, role, assign_manager, managerId, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [name, mobile, email, password, role, managerName, managerId];
    return db.promise().query(query, values);
  };
// Get all employees
// const getAllEmployees = () => {
//   const query = 'SELECT * FROM employees';
//   return db.promise().query(query);
// };

// Get all managers
const getAllManagers = () => {
  const query = 'SELECT id, name FROM employees WHERE role = "manager"';
  return db.promise().query(query);
};

// Get employee by email
const getEmployeeByEmail = (email) => {
  const query = 'SELECT * FROM employees WHERE email = ?';
  return db.promise().query(query, [email]);
};


const getEmployeesByRole = async (role) => {
    const query = `SELECT * FROM employees WHERE role = ?`;
    const [result] = await db.promise().query(query, [role]);
    return result;
  };
  
  // Get all employees (to get employees for managers)
  const getAllEmployees = async () => {
    const query = `SELECT * FROM employees`;
    const [result] = await db.promise().query(query);
    return result;
  };


  const getEmployeesByManagerId = (managerId, callback) => {
    const query = 'SELECT * FROM employees WHERE managerId = ?';
    db.query(query, [managerId], (err, results) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, results);
      }
    });
  };
  


module.exports = {
  registerEmployee,
  getAllEmployees,
  getAllManagers,
  getEmployeeByEmail,
  getManagerById,
  getEmployeesByRole,
  getEmployeesByManagerId
};
