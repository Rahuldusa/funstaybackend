const db = require("../config/db"); // Adjust the path to your DB configuration

const updateLead = (leadid, leadData, callback) => {
  const query = `
    UPDATE addleads
    SET 
      lead_type = ?, 
      name = ?, 
      country_code = ?,
      another_country_code = ?,
      phone_number = ?, 
      email = ?, 
      sources = ?, 
      description = ?, 
      primarySource = ?, 
      secondarysource = ?, 
      another_name = ?, 
      another_email = ?, 
      another_phone_number = ?, 
      destination = ?, 
      corporate_id = ?, 
      primaryStatus = ?, 
      secondaryStatus = ?, 
      opportunity_status1 = ?, 
      opportunity_status2 = ?
    WHERE leadid = ?`;

  const values = [
    leadData.lead_type, 
    leadData.name, 
    leadData.country_code,
    leadData.another_country_code,
    leadData.phone_number, 
    leadData.email, 
    leadData.sources, 
    leadData.description, 
    leadData.primarySource, 
    leadData.secondarysource, 
    leadData.another_name, 
    leadData.another_email, 
    leadData.another_phone_number, 
    leadData.destination, 
    leadData.corporate_id, 
    leadData.primaryStatus, 
    leadData.secondaryStatus, 
    leadData.opportunity_status1, 
    leadData.opportunity_status2, 
    leadid
  ];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("Error updating lead:", err);
      return callback(err, null);
    }
    console.log("Lead updated successfully:", results);
    callback(null, results);
  });
};


// const updateOpportunity = (leadid, opportunityData, callback) => {
//   const query = `
//     UPDATE travel_opportunity
//     SET origincity = ?,destination = ?, start_date = ?, end_date = ?, duration = ?, 
//         adults_count = ?, children_count = ?, child_ages = ?, approx_budget = ?, 
//          notes = ?, comments = ?, reminder_setting = ?, description = ?
//     WHERE leadid = ?`;

//   db.query(query, [
//     opportunityData.origincity,
//     opportunityData.destination,
//     opportunityData.start_date,
//     opportunityData.end_date,
//     opportunityData.duration,
//     opportunityData.adults_count,
//     opportunityData.children_count,
//     opportunityData.child_ages,
//     opportunityData.approx_budget,
   
//     opportunityData.notes,
//     opportunityData.comments,
//     opportunityData.reminder_setting,
//     opportunityData.description,
//     leadid,
//   ], callback);
// };
const updateOpportunity = (leadid, opportunityData, callback) => {
  // Safe conversion of reminder_setting
  let formattedReminder = null;
  if (opportunityData.reminder_setting) {
    formattedReminder = opportunityData.reminder_setting;
    if (typeof formattedReminder === 'string' && formattedReminder.includes('T')) {
      formattedReminder = formattedReminder.replace('T', ' ') + ':00';
    }
  }

  // Ensure all values are properly handled
  const updateOpportunityQuery = `
    UPDATE travel_opportunity
    SET origincity = ?, destination = ?, start_date = ?, end_date = ?, duration = ?, 
        adults_count = ?, children_count = ?, child_ages = ?, approx_budget = ?, total_amount = ?,
        notes = ?, comments = ?, reminder_setting = ?, description = ?
    WHERE leadid = ?`;

  const queryValues = [
    opportunityData.origincity || null,
    opportunityData.destination || null,
    opportunityData.start_date || null,
    opportunityData.end_date || null,
    opportunityData.duration || null,
    opportunityData.adults_count || null,
    opportunityData.children_count || null,
    opportunityData.child_ages || null,
    opportunityData.approx_budget || null,
    opportunityData.approx_budget || null,
    opportunityData.notes || null,
    opportunityData.comments || null,
    formattedReminder,
    opportunityData.description || null,
    leadid
  ];

  db.query(updateOpportunityQuery, queryValues, (err, result) => {
    if (err) {
      console.error("Error updating travel_opportunity:", err);
      return callback(err, null);
    }

    if (result.affectedRows === 0) {
      return callback(null, { affectedRows: 0 });
    }

    // Get the LATEST reminder record for this lead_id
    const getLatestReminderQuery = `
      SELECT id FROM reminder_settings 
      WHERE lead_id = ? 
      ORDER BY id DESC 
      LIMIT 1
    `;
    
    db.query(getLatestReminderQuery, [leadid], (err, reminderResults) => {
      if (err) {
        console.error('Error getting latest reminder:', err);
        updateCustomerCity(leadid, opportunityData, result, callback);
        return;
      }

      if (reminderResults && reminderResults.length > 0) {
        const latestReminderId = reminderResults[0].id;
        
        // Update the LATEST reminder record
        const updateReminderQuery = `
          UPDATE reminder_settings 
          SET reminder_setting = ?, notes = ?, user_id = ?, updated_at = NOW()
          WHERE id = ? AND lead_id = ?
        `;
        
        const reminderValues = [
          formattedReminder,
          opportunityData.notes || null,
          opportunityData.user_id || null,
          latestReminderId,
          leadid
        ];
        
        db.query(updateReminderQuery, reminderValues, (reminderErr) => {
          if (reminderErr) {
            console.error('Error updating latest reminder:', reminderErr);
          }
          updateCustomerCity(leadid, opportunityData, result, callback);
        });
      } else {
        // No reminder exists, optionally create a new one
        const insertReminderQuery = `
          INSERT INTO reminder_settings (lead_id, travel_opportunity_id, reminder_setting, notes, user_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        const insertValues = [
          leadid,
          opportunityData.travel_opportunity_id || null,
          formattedReminder,
          opportunityData.notes || null,
          opportunityData.user_id || null
        ];
        
        db.query(insertReminderQuery, insertValues, (insertErr) => {
          if (insertErr) {
            console.error('Error creating new reminder:', insertErr);
          }
          updateCustomerCity(leadid, opportunityData, result, callback);
        });
      }
    });
  });
};

// Extract customer city update to a separate function
const updateCustomerCity = (leadid, opportunityData, result, callback) => {
  const getCustomerIdQuery = `SELECT customerid FROM addleads WHERE leadid = ?`;
  
  db.query(getCustomerIdQuery, [leadid], (err, leadResults) => {
    if (err) {
      console.error("Error getting customer ID:", err);
      return callback(null, result);
    }

    if (leadResults && leadResults.length > 0 && leadResults[0].customerid) {
      const customerid = leadResults[0].customerid;
      const updateCustomerCityQuery = `UPDATE customers SET origincity = ? WHERE id = ?`;
      
      db.query(updateCustomerCityQuery, [opportunityData.origincity || null, customerid], (cityErr) => {
        if (cityErr) {
          console.error("Error updating customer city:", cityErr);
        }
        return callback(null, result);
      });
    } else {
      return callback(null, result);
    }
  });
};

module.exports = { updateOpportunity };


module.exports = {
  updateLead,
  updateOpportunity,
};
