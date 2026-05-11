const employeeModel = require('../models/employeeModel');
const db = require('../config/db');

// Get all employees
// const getEmployees = async (req, res) => {
//   try {
//     const [result] = await employeeModel.getAllEmployees();
//     res.status(200).json({ message: 'Employees fetched successfully', data: result });
//   } catch (error) {
//     res.status(500).json({ message: 'Database error.', error: error.message });
//   }
// };

// Get all managers
const getManagers = async (req, res) => {
  try {
    const [result] = await employeeModel.getAllManagers();
    res.status(200).json({ message: 'Managers fetched successfully', data: result });
  } catch (error) {
    res.status(500).json({ message: 'Database error.', error: error.message });
  }
};


const getEmployees = async (req, res) => {
    const { role } = req.query; // role can be 'manager' or 'employee'
    
    if (!role) {
      return res.status(400).json({ message: 'Role is required.' });
    }
  
    try {
      const employees = await employeeModel.getEmployeesByRole(role);
      res.status(200).json({ data: employees });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ message: 'Server error.', error: error.message });
    }
  };
  
  // Get all employees to check managers with employees count
  const getAllEmployeesWithManagers = async (req, res) => {
    try {
      const allEmployees = await employeeModel.getAllEmployees();
      const managers = allEmployees.filter(emp => emp.role === 'manager');
      
      // Calculate the count of employees under each manager
      const result = managers.map(manager => {
        const employeesUnderManager = allEmployees.filter(emp => emp.managerId === manager.id);
        return {
          ...manager,
          employeeCount: employeesUnderManager.length,
          teamMembers: employeesUnderManager,
        };
      });
      
      res.status(200).json({ data: result });
    } catch (error) {
      console.error('Error fetching all employees:', error);
      res.status(500).json({ message: 'Server error.', error: error.message });
    }
  };
  

//assignedemployee


const getEmployeesByManagerId = (req, res) => {
  const managerId = req.user.id; // Ensure req.user is set by your authentication middleware

  // Use a callback to handle the query
  db.query('SELECT id, name FROM employees WHERE managerId = ?', [managerId], (error, results) => {
      if (error) {
          console.error('Error fetching employees:', error);
          return res.status(500).json({ message: 'Error fetching employees' });
      }
      res.status(200).json(results); // Send the results back to the client
  });
};
const assignLead = (req, res) => {
  const { leadid, employeeId, employeeName } = req.body;
  
  console.log("Received employee ID:", employeeId); // Log employee ID
  console.log("Received employee Name:", employeeName); // Log employee name

  const query = `
    UPDATE addleads 
    SET assignedSalesId = ?, assignedSalesName = ? 
    WHERE leadid = ?
  `;

  db.query(query, [employeeId, employeeName, leadid], (error, results) => {
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



const getEmployeesByManager = (req, res) => {
  const managerId = req.params.managerId;

  employeeModel.getEmployeesByManagerId(managerId, (err, employees) => {
    if (err) {
      res.status(500).json({ message: 'Database query error', error: err });
      return;
    }

    if (employees.length === 0) {
      res.status(404).json({ message: 'No employees found for the selected manager' });
      return;
    }

    res.json(employees);
  });
};


const deleteEmployee = (req, res) => {
  const employeeId = req.params.id;

  const sql = 'DELETE FROM employees WHERE id = ?';
  db.query(sql, [employeeId], (err, result) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Employee not found' });
      }
      res.status(204).send(); // No Content
  });
};



module.exports = {
  getEmployees,
  getManagers,
  getAllEmployeesWithManagers,
  getEmployeesByManagerId ,
  assignLead,
  getEmployeesByManager,
  deleteEmployee
};
