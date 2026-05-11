// models/assigneeModel.js
// const db = require('../config/db'); // Import the database connection

// const updateAssignee = async (leadid, assignee, managerid) => {
//   // Update both `assign_to_manager` and `managerid` fields in the `addleads` table
//   const query = `UPDATE addleads SET assign_to_manager = ?, managerid = ? WHERE leadid = ?`;
//   const [result] = await db.promise().execute(query, [managerid, assignee, leadid]);
//   return result;
// };

// models/assigneeModel.js
const db = require('../config/db');

// const updateAssigneeModel = (
//   leadid,
//   assignee,
//   managerid,
//   assignedSalesId,
//   assignedSalesName,
//   callback
// ) => {
//   console.log("Received update parameters:", leadid, assignee, managerid, assignedSalesId, assignedSalesName);

//   // Update the lead record with the new assignee and manager.
//   // (Ensure that your WHERE clause matches the correct column in the addleads table. 
//   // If your primary key is named 'id', adjust accordingly.)
//   const updateLeadQuery = 'UPDATE addleads SET assign_to_manager = ?, managerid = ? WHERE leadid = ?';
//   db.query(updateLeadQuery, [assignee, managerid, leadid], (err, updateResult) => {
//     if (err) {
//       return callback(err);
//     }

//     // Insert a record into reassignleads with the provided details.
//     const insertReassignQuery = `
//       INSERT INTO reassignleads (
//         leadid, assignedSalesId, assignedSalesName, assign_to_manager, managerid
//       )
//       VALUES (?, ?, ?, ?, ?)
//     `;
//     db.query(
//       insertReassignQuery,
//       [leadid, assignedSalesId, assignedSalesName, assignee, managerid],
//       (errReassign, reassignResult) => {
//         if (errReassign) {
//           return callback(errReassign);
//         }

//         // Insert a notification for the manager.
//         const notificationMessage = 'Admin assigned you a Lead';
//         const insertNotificationQuery = `
//           INSERT INTO notifications (managerid, message, createdAt, \`read\`)
//           VALUES (?, ?, NOW(), 0)
//         `;
//         db.query(insertNotificationQuery, [managerid, notificationMessage], (errNotif, insertResult) => {
//           if (errNotif) {
//             return callback(errNotif);
//           }
//           return callback(null, { updateResult, reassignResult, insertResult });
//         });
//       }
//     );
//   });
// };

const updateAssigneeModel = (
  leadid,
  assignee,
  managerid,
  assignedSalesId,
  assignedSalesName,
  status,
  callback
) => {
  console.log("Received update parameters:", leadid, assignee, managerid, assignedSalesId, assignedSalesName,status);

  // Update the lead record with the new assignee and manager.
  // (Ensure that your WHERE clause matches the correct column in the addleads table. 
  // If your primary key is named 'id', adjust accordingly.)
  const updateLeadQuery = 'UPDATE addleads SET assign_to_manager = ?, managerid = ?,managerAssign = null ,adminAssign = null,assignedSalesId = null,	assignedSalesName = null WHERE leadid = ?';
  db.query(updateLeadQuery, [assignee, managerid, leadid,status], (err, updateResult) => {
    if (err) {
      return callback(err);
    }

    // Insert a record into reassignleads with the provided details.
    const insertReassignQuery = `
      INSERT INTO reassignleads (
        leadid, assignedSalesId, assignedSalesName, assign_to_manager, managerid,status
      )
      VALUES (?, ?, ?, ?, ?,?)
    `;
    db.query(
      insertReassignQuery,
      [leadid, assignedSalesId, assignedSalesName, assignee, managerid,status],
      (errReassign, reassignResult) => {
        if (errReassign) {
          return callback(errReassign);
        }

        // Insert a notification for the manager.
        // const notificationMessage = 'Admin assigned you a Lead';
        const notificationMessage = `Admin assigned you a ${status}`;
        const insertNotificationQuery = `
          INSERT INTO notifications (managerid,leadid, message, createdAt, \`read\`,status)
          VALUES (?, ? ,?, NOW(), 0,?)
        `;
        db.query(insertNotificationQuery, [managerid,leadid, notificationMessage, status], (errNotif, insertResult) => {
          if (errNotif) {
            return callback(errNotif);
          }
          return callback(null, { updateResult, reassignResult, insertResult });
        });
      }
    );
  });
};

const getAssociatesModel = (managerid, callback) => {
  // Query to fetch names of employees where managerid matches
  const query = 'SELECT id,name FROM employees WHERE managerid = ?';
  
  db.query(query, [managerid], (err, results) => {
    if (err) {
      return callback(err);
    }
    // Return the results containing the names of associates
    callback(null, results);
  });
};


module.exports = { updateAssigneeModel , getAssociatesModel};



// module.exports = { assigneeModel };

