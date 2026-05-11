const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");

// Multer storage configuration for image uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Get employee details by ID
router.get("/employee/:id", (req, res) => {
  const employeeId = req.params.id;
  const query = "SELECT * FROM employees WHERE id = ?";
  
  db.query(query, [employeeId], (err, results) => {
    if (err) {
      console.error("Error fetching employee:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(results[0]);
  });
});

// Update employee details including image
router.put("/employee/update/:id", upload.single("image"), (req, res) => {
  const employeeId = req.params.id;
  console.log("Received Body:", req.body);
  const { name, email, mobile, dob, qualification, address } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  console.log("Received Body:", req.file);
  let query = "UPDATE employees SET name=?, email=?, mobile=?, dob=?, qualification=?, address=?";
  let values = [name, email, mobile, dob, qualification, address];

  if (image) {
    query += ", image=?";
    values.push(image);
  }

  query += " WHERE id=?";
  values.push(employeeId);

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error updating employee:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json({ message: "Profile updated successfully" });
  });
});




// router.put("/updateemployee/:id", (req, res) => {
//   const employeeId = req.params.id;
//   console.log("Received Body:", req.body);

//   const { name, email, mobile, password, role, managerId, assign_manager } = req.body;

//   // Update query with correct syntax
//   let query = `
//     UPDATE employees 
//     SET name = ?, email = ?, mobile = ?, password = ?, role = ?, managerId = ?, assign_manager = ? 
//     WHERE id = ?`;

//   let values = [name, email, mobile, password, role, managerId, assign_manager, employeeId];

//   db.query(query, values, (err, result) => {
//     if (err) {
//       console.error("Error updating employee:", err);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//     res.json({ message: "Profile updated successfully" });
//   });
// });


router.put("/updateemployee/:id", (req, res) => {
  const employeeId = req.params.id;
  const {
    name,
    email,
    mobile,
    password,
    role,
    managerId,
    assign_manager,
    username
  } = req.body;

  const updateEmployeeQuery = `
    UPDATE employees 
    SET name = ?, email = ?, mobile = ?, password = ?, role = ?, managerId = ?, assign_manager = ? 
    WHERE id = ?
  `;
  const values = [name, email, mobile, password, role, managerId, assign_manager, employeeId];

  db.query(updateEmployeeQuery, values, (err, result) => {
    if (err) {
      console.error("Error updating employee:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Handle leads logic based on role change
    if (role === "manager") {
      // Promote to manager - update leads where this employee is assigned
      const promoteQuery = `
        UPDATE addleads
        SET 
          old_maanger_id = managerid,
          old_manager_name = assign_to_manager,
          managerid = ?,
          assign_to_manager = ?,
          managerAssign = managerid  -- Set managerAssign to the new managerid
        WHERE assignedSalesId = ? 
          AND (managerAssign IS NULL OR managerAssign != managerid)
      `;
      db.query(promoteQuery, [employeeId, name, employeeId], (err2) => {
        if (err2) {
          console.error("Error updating leads during role change:", err2);
          return res.status(500).json({ error: "Error promoting to manager" });
        }
        res.json({ message: "Employee updated and promoted to manager successfully" });
      });

    } else if (role === "employee") {
      // Demote manager to employee
      const demoteQuery = `
        UPDATE addleads
        SET 
          managerid = old_maanger_id,
          assign_to_manager = old_manager_name,
          managerAssign = NULL  -- Clear managerAssign for demoted employees
        WHERE managerid = ? 
          AND old_maanger_id IS NOT NULL
      `;
      db.query(demoteQuery, [employeeId], (err3) => {
        if (err3) {
          console.error("Error updating leads during demotion:", err3);
          return res.status(500).json({ error: "Error demoting to employee" });
        }
        res.json({ message: "Employee updated and demoted to employee successfully" });
      });

    } else {
      // No lead updates needed for other roles
      res.json({ message: "Employee updated successfully" });
    }
  });
});

module.exports = router;
