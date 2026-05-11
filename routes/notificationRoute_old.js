const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Adjust the path to your database connection

// Updated /update-assignee endpoint using SQL queries
// router.put('/update-assignee', (req, res) => {
//     const { leadid, assignee, managerid } = req.body;
  
//     // Update the lead with the new assignee.
//     const updateLeadQuery = 'UPDATE addleads SET assign_to_manager = ? WHERE leadid = ?';
//     db.query(updateLeadQuery, [assignee, leadid], (err, result) => {
//       if (err) {
//         console.error('Error updating lead:', err);
//         return res.status(500).json({ message: 'Error updating lead' });
//       }
  
//       // Insert a notification for the manager.
//       const notificationMessage = "Admin assigned you an Employee";
//       const insertNotificationQuery = `
//         INSERT INTO notifications (managerid, message, createdAt, \`read\`)
//         VALUES (?, ?, NOW(), 0)
//       `;
//       db.query(insertNotificationQuery, [managerid, notificationMessage], (err2, result2) => {
//         if (err2) {
//           console.error('Error inserting notification:', err2);
//           return res.status(500).json({ message: 'Error inserting notification' });
//         }
//         res.status(200).json({ message: "Assignee updated and notification sent." });
//       });
//     });
//   });
  
  
  router.get('/api/notifications', (req, res) => {
    const managerid = req.query.managerid;
    const query = "SELECT * FROM notifications WHERE managerid = ? AND `read` = 0 ORDER BY createdAt DESC";
  
    db.query(query, [managerid], (err, results) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ message: 'Error fetching notifications' });
      }
      res.json({ notifications: results });
    });
  });
  
  // Mark a notification as read
  router.put('/api/notifications/:id', (req, res) => {
    const notificationId = req.params.id;
    const { read } = req.body; // should be true
    const query = "UPDATE notifications SET `read` = ? WHERE id = ?";
    db.query(query, [read ? 1 : 0, notificationId], (err, result) => {
      if (err) {
        console.error("Error updating notification:", err);
        return res.status(500).json({ message: "Error updating notification" });
      }
      res.json({ message: "Notification updated" });
    });
  });

  router.get('/sales/notifications', (req, res) => {
    const managerid = req.query.managerid;


  // if (!managerid) {
  //   return res.status(400).json({ message: "Missing managerid" });
  // }

  // console.log("Received managerid:", managerid);

    const query = "SELECT * FROM notifications WHERE employeeId = ? AND `read` = 0 ORDER BY createdAt DESC";
  
    db.query(query, [managerid], (err, results) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ message: 'Error fetching notifications' });
      }
      res.json({ notifications: results });
    });
  });
  
  // Mark a notification as read
  router.put('/sales/notifications/:id', (req, res) => {
    const notificationId = req.params.id;
    const { read } = req.body; // should be true
    const query = "UPDATE notifications SET `read` = ? WHERE id = ?";
    db.query(query, [read ? 1 : 0, notificationId], (err, result) => {
      if (err) {
        console.error("Error updating notification:", err);
        return res.status(500).json({ message: "Error updating notification" });
      }
      res.json({ message: "Notification updated" });
    });
  });

  module.exports = router;