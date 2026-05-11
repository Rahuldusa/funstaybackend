const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Adjust the path to your database connection

// Update customer and lead data based on leadid
router.put('/api/customers/update/by-lead/:leadid', (req, res) => {
    const leadid = req.params.leadid;
    const customerData = req.body;
  
    if (!customerData || Object.keys(customerData).length === 0) {
      return res.status(400).json({ message: "Invalid request. No data provided." });
    }
  
    // Check if at least one field has a non-null value
    const hasValidData = Object.values(customerData).some(value => value !== null && value !== undefined);
    if (!hasValidData) {
      return res.status(400).json({ message: "Invalid request. No valid data provided." });
    }
  
    const leadQuery = 'SELECT customerid FROM addleads WHERE leadid = ?';
    db.query(leadQuery, [leadid], (err, leadResults) => {
      if (err) {
        console.error("Error fetching customer ID from leads:", err);
        return res.status(500).json({ message: "Database error while fetching customer ID." });
      }
  
      if (leadResults.length === 0) {
        return res.status(404).json({ message: "Lead not found." });
      }
  
      const customerid = leadResults[0].customerid;
      console.log("Fetched Customer ID:", customerid);
  
      const updateCustomerQuery = `
        UPDATE customers 
        SET 
          name = COALESCE(?, name), 
          country_code = COALESCE(?, country_code),
          phone_number = COALESCE(?, phone_number),
          email = COALESCE(?, email), 
          preferred_contact_method = COALESCE(?, preferred_contact_method), 
          travel_type = COALESCE(?, travel_type), 
          passport_number = COALESCE(?, passport_number), 
          special_requirement = COALESCE(?, special_requirement)
        WHERE id = ?
      `;
  
      const customerValues = [
        customerData.name || null,
        customerData.country_code || null,
        customerData.phone_number || null,
        customerData.email || null,
        customerData.preferred_contact_method || null,
        customerData.travel_type || null,
        customerData.passport_number || null,
        customerData.special_requirement || null,
        customerid,
      ];
  
      console.log("Customer Update Query:", updateCustomerQuery);
      console.log("Customer Values:", customerValues);
  
      db.query(updateCustomerQuery, customerValues, (err, customerResult) => {
        if (err) {
          console.error("Error updating customer data:", err);
          return res.status(500).json({ message: "Failed to update customer data." });
        }
  
        console.log("Customer Update Result:", customerResult);
  
        const updateLeadQuery = `
          UPDATE addleads 
          SET 
            name = COALESCE(?, name), 
            country_code = COALESCE(?, country_code),
            phone_number = COALESCE(?, phone_number),
            email = COALESCE(?, email), 
            preferred_contact_method = COALESCE(?, preferred_contact_method), 
            travel_type = COALESCE(?, travel_type), 
            passport_number = COALESCE(?, passport_number), 
            special_requirement = COALESCE(?, special_requirement)
          WHERE leadid = ?
        `;
  
        const leadValues = [
          customerData.name || null,
          customerData.country_code || null,
          customerData.phone_number || null,
          customerData.email || null,
          customerData.preferred_contact_method || null,
          customerData.travel_type || null,
          customerData.passport_number || null,
          customerData.special_requirement || null,
          leadid,
        ];
  
        console.log("Lead Update Query:", updateLeadQuery);
        console.log("Lead Values:", leadValues);
  
        db.query(updateLeadQuery, leadValues, (err, leadResult) => {
          if (err) {
            console.error("Error updating lead data:", err);
            return res.status(500).json({ message: "Failed to update lead data." });
          }
  
          console.log("Lead Update Result:", leadResult);
          res.status(200).json({ message: "Customer and lead data updated successfully!" });
        });
      });
    });
  });

module.exports = router;
