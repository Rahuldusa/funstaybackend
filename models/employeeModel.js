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


//   const updateEmployeeModel = (leadid, employeeId, employeeName, managerId, callback) => {
//     // Update the lead with the new assignee.

//     // Ensure employeeId and managerId are strings
//     const empId = String(employeeId);
//     const mgrId = String(managerId);
    
//     const updateLeadQuery = 'UPDATE addleads SET assignedSalesName = ?, assignedSalesId = ? WHERE leadid = ?';
//     db.query(updateLeadQuery, [ employeeId,employeeName, leadid], (err, updateResult) => {
//         if (err) {
//             return callback(err);
//         }
//         // Insert a notification for the employee.
//         const notificationMessage = 'Manager assigned you a Lead';
//         const insertNotificationQuery = `
//             INSERT INTO notifications (employeeId, managerid, message, createdAt, \`read\`)
//             VALUES (?, ?, ?, NOW(), 0)
//         `;
//         db.query(insertNotificationQuery, [employeeId, managerId, notificationMessage], (err2, insertResult) => {
//             if (err2) {
//                 return callback(err2);
//             }
//             return callback(null, { updateResult, insertResult });
//         });
//     });
// };

const updateEmployeeModel = (leadid, employeeName, employeeId, managerId, userId, userName,status, callback) => {
  // Validate required fields.
  // if (!leadid || !employeeName || !employeeId || !managerId || !userId || !userName) {
  //   return callback(new Error('Missing required fields'));
  // }

  // Update the addleads record with the new assignee information.
  const updateLeadQuery = 'UPDATE addleads SET assignedSalesName = ?, assignedSalesId = ?,adminAssign = null,managerAssign = null WHERE leadid = ?';
  db.query(updateLeadQuery, [employeeName, employeeId, leadid], (err, updateResult) => {
    if (err) {
      return callback(err);
    }

    // Insert a new record into reassignleads.
    const insertReassignQuery = `
      INSERT INTO reassignleads (
        leadid, assignedSalesId, assignedSalesName, assign_to_manager, managerid,status
      )
      VALUES (?, ?, ?, ?, ?,?)
    `;
    db.query(
      insertReassignQuery,
      [leadid, employeeId, employeeName, userName, userId,status],
      (errReassign, reassignResult) => {
        if (errReassign) {
          return callback(errReassign);
        }

        // Insert a notification for the manager.
        const notificationMessage = `(Manager) assigned you a ${status}`;
        const insertNotificationQuery = `
          INSERT INTO notifications (employeeId,leadid, managerid, name, message, createdAt, \`read\`,status)
          VALUES (?,?, ?, ?, ?, NOW(), 0, ?)
        `;
        db.query(
          insertNotificationQuery,
          [employeeId,leadid, managerId, userName, notificationMessage,status],
          (errNotif, notificationResult) => {
            if (errNotif) {
              return callback(errNotif);
            }
            return callback(null, { updateResult, reassignResult, notificationResult });
          }
        );
      }
    );
  });
};

const adminupdateEmployeeModel = (leadid, employeeName, employeeId, managerId, userId, userName,status, callback) => {
  // Validate required fields.
  // if (!leadid || !employeeName || !employeeId || !managerId || !userId || !userName) {
  //   return callback(new Error('Missing required fields'));
  // }

  // Update the addleads record with the new assignee information.
  const updateLeadQuery = 'UPDATE addleads SET assignedSalesName = ?, assignedSalesId = ?,managerAssign = null,adminAssign = null WHERE leadid = ?';
  db.query(updateLeadQuery, [employeeName, employeeId, leadid], (err, updateResult) => {
    if (err) {
      return callback(err);
    }

    // Insert a new record into reassignleads.
    const insertReassignQuery = `
      INSERT INTO reassignleads (
        leadid, assignedSalesId, assignedSalesName, assign_to_manager, managerid,status
      )
      VALUES (?, ?, ?, ?, ?,?)
    `;
    db.query(
      insertReassignQuery,
      [leadid, employeeId, employeeName, userName, userId,status],
      (errReassign, reassignResult) => {
        if (errReassign) {
          return callback(errReassign);
        }

        // Insert a notification for the manager.
        const notificationMessage = `Admin assigned you a ${status}`;
        const insertNotificationQuery = `
          INSERT INTO notifications (employeeId,leadid, managerid, name, message, createdAt, \`read\`,status)
          VALUES (?, ?, ?, ?, ?, NOW(), 0,?)
        `;
        db.query(
          insertNotificationQuery,
          [employeeId,leadid, managerId, userName, notificationMessage,status],
          (errNotif, notificationResult) => {
            if (errNotif) {
              return callback(errNotif);
            }
            return callback(null, { updateResult, reassignResult, notificationResult });
          }
        );
      }
    );
  });
};


module.exports = {
  registerEmployee,
  getAllEmployees,
  getAllManagers,
  getEmployeeByEmail,
  getManagerById,
  getEmployeesByRole,
  getEmployeesByManagerId,
  updateEmployeeModel,
  adminupdateEmployeeModel
};
