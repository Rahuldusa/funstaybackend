const Lead = require('../models/leadModel');
const db = require('../config/db');
exports.createLead = (req, res) => {
  const {
    lead_type,
    name,
    email,
    phone_number,
    country_code,
    primarySource,
    secondarysource,
    destination,
    another_name,
    another_email,
    another_phone_number,
    corporate_id,
    description,
    assignedSalesId,
    assignedSalesName,
    assign_to_manager,
    managerid,
  } = req.body;

  // Check if customer already exists
  const checkCustomerQuery = "SELECT id, customer_status FROM customers WHERE phone_number = ?";
  db.query(checkCustomerQuery, [phone_number], (err, results) => {
    if (err) {
      console.error("Error checking customer existence:", err);
      return res.status(500).json({ message: "Database error." });
    }

    let customerId;
    let customerStatus = "new"; // Default status is 'new'

    if (results.length > 0) {
      // Customer already exists
      customerId = results[0].id;
      // Check the existing customer status
      if (results[0].customer_status === "existing") {
        customerStatus = "existing"; // Set status to 'existing' if it is already existing
      }
      insertLead();
    } else {
      // Insert new customer
      const insertCustomerQuery = `
        INSERT INTO customers (name, email, phone_number, country_code, another_name, another_email, another_phone_number, customer_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const customerData = [
        name, email, phone_number, country_code, another_name, another_email, another_phone_number, "new"
      ];
      
      db.query(insertCustomerQuery, customerData, (err, result) => {
        if (err) {
          console.error("Error inserting customer:", err);
          return res.status(500).json({ message: "Failed to add customer." });
        }
        customerId = result.insertId;
        insertLead();
      });
    }

    function insertLead() {
      const insertLeadQuery = `
        INSERT INTO addleads (
          lead_type, name, email, phone_number, country_code, primarySource, secondarysource, destination,
          another_name, another_email, another_phone_number, corporate_id, description, assignedSalesId, assignedSalesName,
          assign_to_manager, managerid, customerid, customer_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const leadData = [
        lead_type, name, email, phone_number, country_code, primarySource, secondarysource, destination,
        another_name, another_email, another_phone_number, corporate_id ? Number(corporate_id) : null,
        description, assignedSalesId ? Number(assignedSalesId) : null, assignedSalesName, assign_to_manager,
        managerid ? Number(managerid) : null, customerId, customerStatus // Use the updated customerStatus
      ];
      
      db.query(insertLeadQuery, leadData, (err, result) => {
        if (err) {
          console.error("Error inserting/updating lead:", err);
          return res.status(500).json({ message: "Failed to add lead." });
        }
        res.status(201).json({ message: "Lead added/updated successfully!", leadId: result.insertId });
      });
    }
  });
};

exports.getAllLeads = (req, res) => {
  Lead.fetchAllLeads((err, results) => {
    if (err) {
      console.error('Error fetching leads:', err);
      res.status(500).json({ message: 'Failed to fetch leads.' });
    } else {
      res.status(200).json(results);
    }
  });
};

exports.getLeadById = (req, res) => {
  const { leadid } = req.params;
  Lead.fetchLeadById(leadid, (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching lead.' });
    } else if (result.length === 0) {
      res.status(404).json({ message: 'Lead not found.' });
    } else {
      res.status(200).json(result[0]);
    }
  });
};

exports.updateLead = (req, res) => {
  const { leadid } = req.params;
  const data = req.body;
  Lead.updateLead(leadid, data, (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Failed to update lead.' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Lead not found.' });
    } else {
      res.status(200).json({ message: 'Lead updated successfully.' });
    }
  });
};

exports.deleteLead = (req, res) => {
  const { leadid } = req.params;
  Lead.deleteLead(leadid, (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Failed to delete lead.' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Lead not found.' });
    } else {
      res.status(200).json({ message: 'Lead deleted successfully.' });
    }
  });
};


// exports.updateLeadStatus = (req, res) => {
//   const { leadid } = req.params; // Lead ID from the URL
//   const { primaryStatus, secondaryStatus } = req.body; // Status fields from the request body

//   // Validate the request payload
//   if (!primaryStatus || !secondaryStatus) {
//     return res.status(400).json({
//       message: 'Primary status and secondary status are required.',
//     });
//   }

//   // Call the model to update the lead status
//   Lead.updateLeadStatus(leadid, primaryStatus, secondaryStatus, (err, result) => {
//     if (err) {
//       console.error('Error updating lead status:', err);
//       return res.status(500).json({ message: 'Failed to update lead status.' });
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: 'Lead not found.' });
//     }

//     res.status(200).json({ message: 'Lead status updated successfully.' });
//   });
// };

exports.updateLeadStatus = (req, res) => {
  const { leadid } = req.params; // Lead ID from the URL
  const { primaryStatus, secondaryStatus } = req.body; // Status fields from the request body

  // Validate the request payload
  if (!primaryStatus && !secondaryStatus) {
    return res.status(400).json({
      message: 'At least one of primary status or secondary status is required.',
    });
  }

  // Call the model to update the lead status
  Lead.updateLeadStatus(leadid, primaryStatus, secondaryStatus, (err, result) => {
    if (err) {
      console.error('Error updating lead status:', err);
      return res.status(500).json({ message: 'Failed to update lead status.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    // Determine the message based on the statuses updated
    let statusChangeMessage = 'Lead status updated successfully.';
    if (primaryStatus && secondaryStatus) {
      statusChangeMessage = 'Both primary and secondary statuses updated successfully!';
    } else if (primaryStatus) {
      statusChangeMessage = 'Primary status updated successfully!';
    } else if (secondaryStatus) {
      statusChangeMessage = 'Secondary status updated successfully!';
    }

    res.status(200).json({ message: statusChangeMessage });
  });
};


exports.getLeadData = (req, res) => {
  const { leadid } = req.params;

  Lead.getLeadData(leadid, (err, results) => {
    if (err) {
      console.error('Error fetching lead data:', err.message);
      res.status(500).json({ error: 'Failed to fetch data', details: err.message });
    } else if (results.length > 0) {
      res.status(200).json(results[0]); // Return the first result
    } else {
      res.status(404).json({ message: 'No lead data found for the given ID' });
    }
  });
};

