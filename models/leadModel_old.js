const db = require('../config/db');





const Lead = {
  createLead: (data, callback) => {
    const query = `
      INSERT INTO addleads (
        lead_type, name, email, phone_number, country_code, primarySource, secondarysource, destination,
         another_name, another_email,
        another_phone_number,corporate_id, description,assignedSalesId,assignedSalesName,assign_to_manager,managerid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [...data], callback);
  },


  fetchAllLeads: (callback) => {
    const query = 'SELECT * FROM addleads ORDER BY created_at DESC';
    db.query(query, callback);
  },

  fetchLeadById: (leadid, callback) => {
    const query = 'SELECT * FROM addleads WHERE leadid = ?';
    db.query(query, [leadid], callback);
  },

  updateLead: (leadid, data, callback) => {
    const query = 'UPDATE addleads SET ? WHERE leadid = ?';
    db.query(query, [data, leadid], callback);
  },

  updateLeadStatus: (leadid, primaryStatus, secondaryStatus, callback) => {
    const query = `
      UPDATE addleads
      SET primaryStatus = ?, secondaryStatus = ?
      WHERE leadid = ?
    `;
    db.query(query, [primaryStatus, secondaryStatus, leadid], callback);
  },

  deleteLead: (leadid, callback) => {
    const query = 'DELETE FROM addleads WHERE leadid = ?';
    db.query(query, [leadid], callback);
  },


  updateLeadStatus: (leadid, primaryStatus, secondaryStatus, callback) => {
    // Prepare the query and values
    let query = 'UPDATE addleads SET ';
    const values = [];
  
    // Only update primaryStatus if it is provided
    if (primaryStatus) {
      query += 'primaryStatus = ?';
      values.push(primaryStatus);
    }
  
    // Only update secondaryStatus if it is provided
    if (secondaryStatus) {
      if (primaryStatus) {
        query += ', '; // Add a comma if primaryStatus is also being updated
      }
      query += 'secondaryStatus = ?';
      values.push(secondaryStatus);
    }
  
    // Complete the query with the WHERE clause
    query += ' WHERE leadid = ?';
    values.push(leadid);
  
    // Execute the query
    db.query(query, values, callback);
  },
  updateLeadStatusOpp: (leadid, status, callback) => {
    const query = 'UPDATE addleads SET status = ? WHERE leadid = ?';
    db.query(query, [status, leadid], callback);
  },

  getLeadData: (leadid, callback) => {
    const query = `
      SELECT 
        addleads.*, 
        travel_opportunity.*, 
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', comments.id,
            'text', comments.text,
            'timestamp', comments.timestamp
          )
        ) AS comments
      FROM 
        addleads
      LEFT JOIN 
        travel_opportunity
      ON 
        addleads.leadid = travel_opportunity.leadid
      LEFT JOIN 
        comments
      ON 
        addleads.leadid = comments.leadid
      WHERE 
        addleads.leadid = ?
      GROUP BY 
        addleads.leadid;
    `;
  
    db.query(query, [leadid], (err, results) => {
      if (err) {
        callback(err, null); // Pass the error to the controller
      } else if (results.length > 0) {
        try {
          // Parse the comments if they exist
          if (results[0].comments) {
            results[0].comments = JSON.parse(`[${results[0].comments}]`);
          } else {
            results[0].comments = []; // Fallback to empty array if no comments
          }
          callback(null, results);
        } catch (parseError) {
          console.error('Error parsing comments JSON:', parseError.message);
          results[0].comments = []; // Fallback to empty array if parsing fails
          callback(null, results);
        }
      } else {
        callback(null, []); // Handle case where no matching data is found
      }
    });
  },
  
  


  
};

module.exports = Lead;
