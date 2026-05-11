const express = require("express");
const router = express.Router();
const db = require("./../config/db"); // Assuming you have a database connection

// Assign to Self API
// router.post("/assign-manager", (req, res) => {
//     const { leadid, userId } = req.body;
  
//     if (!leadid || !userId) {
//       return res.status(400).json({ message: "Lead ID and User ID are required." });
//     }
  
//     const query = "UPDATE addleads SET managerassign = ? WHERE leadid = ?";
//     db.query(query, [userId, leadid], (error, results) => {
//       if (error) {
//         console.error("Error updating lead:", error);
//         return res.status(500).json({ message: "An error occurred while assigning the lead." });
//       }
  
//       if (results.affectedRows === 0) {
//         return res.status(404).json({ message: "Lead not found." });
//       }
  
//       res.status(200).json({ message: "Lead assigned successfully." });
//     });
//   });

router.post("/assign-manager", (req, res) => {
  const { leadid, userId } = req.body;

  if (!leadid || !userId) {
    return res.status(400).json({ message: "Lead ID and User ID are required." });
  }

  const query = `
    UPDATE addleads 
    SET managerassign = ?, 
        assignedSalesId = NULL, 
        assignedSalesName = NULL,
        adminAssign = NULL 
    WHERE leadid = ?`;
  db.query(query, [userId, leadid], (error, results) => {
    if (error) {
      console.error("Error updating lead:", error);
      return res.status(500).json({ message: "An error occurred while assigning the lead." });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Lead not found." });
    }

    res.status(200).json({ message: "Lead assigned successfully." });
  });
});


  // router.post("/assign-admin", (req, res) => {
  //   const { leadid } = req.body;
    
  //   if (!leadid) {
  //     return res.status(400).json({ message: "Lead ID is required." });
  //   }
  
  //   const query = "UPDATE addleads SET adminAssign = ? WHERE leadid = ?";
  //   db.query(query, ["admin", leadid], (error, results) => { // Hardcoded 'admin'
  //     if (error) {
  //       console.error("Error updating lead:", error);
  //       return res.status(500).json({ message: "An error occurred while assigning the lead." });
  //     }
  
  //     if (results.affectedRows === 0) {
  //       return res.status(404).json({ message: "Lead not found." });
  //     }
  
  //     res.status(200).json({ message: "Lead assigned successfully." });
  //   });
  // });

  router.post("/assign-admin", (req, res) => {
    const { leadid } = req.body;
  
    if (!leadid) {
      return res.status(400).json({ message: "Lead ID is required." });
    }
  
    const query = `
      UPDATE addleads 
      SET adminAssign = ?, 
          assignedSalesId = NULL, 
          assignedSalesName = NULL, 
          managerid = NULL, 
          assign_to_manager = NULL,
          managerAssign = NULL 
      WHERE leadid = ?`;
  
    db.query(query, ["admin", leadid], (error, results) => {
      if (error) {
        console.error("Error updating lead:", error);
        return res.status(500).json({ message: "An error occurred while assigning the lead." });
      }
  
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Lead not found." });
      }
  
      res.status(200).json({ message: "Lead assigned successfully." });
    });
  });
  
  

module.exports = router;
