const express = require('express');
const router = express.Router();
const db = require('../config/db');



// POST API to add a new manager
router.post('/addmanager', async (req, res) => {
    // Destructure the request body to extract all fields
    const {
        salutation,
        employee_name,
        employee_status,
        office_mail,
        office_mobile_number,
        employee_id,
        personal_mobile_number,
        designation,
        department,
        role,
        assign_manager,
        managerid,
        reporting_to,
        fathers_name,
        dob,
        gender,
        marital_status,
        aadhar,
        pan,
        religion,
        blood_group,
        personal_email,
        ctc,
        gstin,
        emergency_contact,
        branch,
        uan_number,
        esi_number,
        date_of_joining,
        check_in_time,
        check_out_time,
        date_of_exit,
        password,
        upload_image,
        address_line_1,
        address_line_2,
        city,
        pincode,
        select_state,
        country,
        present_address_line_1,
        present_address_line_2,
        present_city,
        present_pincode,
        present_select_state,
        present_country,
        account_number,
        account_name,
        bank_name,
        ifsc_code,
        account_type,
        branch_name
    } = req.body;

    try {
        const query = `
        INSERT INTO addmanager (
          salutation, employee_name, employee_status, office_mail, office_mobile_number, employee_id,
          personal_mobile_number, designation, department, role, assign_manager,managerid, reporting_to, fathers_name, dob, gender,
          marital_status, aadhar, pan, religion, blood_group, personal_email, ctc, gstin, emergency_contact,
          branch, uan_number, esi_number, date_of_joining, check_in_time, check_out_time, date_of_exit, password,
          upload_image, address_line_1, address_line_2, city, pincode, select_state, country,  present_address_line_1,
          present_address_line_2, present_city, present_pincode, present_select_state, present_country, account_number,
          account_name, bank_name, ifsc_code, account_type, branch_name
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
        const values = [
            salutation,
            employee_name,
            employee_status,
            office_mail,
            office_mobile_number,
            employee_id,
            personal_mobile_number,
            designation,
            department,
            role,
            assign_manager,
            managerid,
            reporting_to,
            fathers_name,
            dob,
            gender,
            marital_status,
            aadhar,
            pan,
            religion,
            blood_group,
            personal_email,
            ctc,
            gstin,
            emergency_contact,
            branch,
            uan_number,
            esi_number,
            date_of_joining,
            check_in_time,
            check_out_time,
            date_of_exit,
            password,
            upload_image,
            address_line_1,
            address_line_2,
            city,
            pincode,
            select_state,
            country,
            present_address_line_1,
            present_address_line_2,
            present_city,
            present_pincode,
            present_select_state,
            present_country,
            account_number,
            account_name,
            bank_name,
            ifsc_code,
            account_type,
            branch_name
        ];

        const [result] = await db.promise().query(query, values);

        res.status(201).json({ message: 'Manager added successfully', id: result.insertId });
    } catch (err) {
        console.error('Error inserting manager:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET API to retrieve all manager records
router.get('/api/addmanager', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM addmanager');
        console.log(rows);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error retrieving managers:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET API to retrieve a manager based on selected id
router.get('/addmanager/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      // Query to select the manager record based on the id
      const query = 'SELECT * FROM addmanager WHERE id = ?';
      const [rows] = await db.promise().query(query, [id]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Manager not found' });
      }
  
      // Return the manager record
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error('Error fetching manager:', err);
      res.status(500).json({ error: err.message });
    }
  });
  // DELETE API to remove a manager based on the provided ID
router.delete('/addmanager/:id', async (req, res) => {
  const { id } = req.params; // Get the ID from the request parameters

  try {
      // Query to delete the manager record based on the ID
      const query = 'DELETE FROM addmanager WHERE id = ?';
      const [result] = await db.promise().query(query, [id]);

      // Check if any rows were affected (i.e., if the delete was successful)
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Manager not found' });
      }

      // Return a success message
      res.status(200).json({ message: 'Manager deleted successfully' });
  } catch (err) {
      console.error('Error deleting manager:', err);
      res.status(500).json({ error: err.message });
  }
});




module.exports = router;