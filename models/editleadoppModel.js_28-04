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
  const updateOpportunityQuery = `
    UPDATE travel_opportunity
    SET origincity = ?, destination = ?, start_date = ?, end_date = ?, duration = ?, 
        adults_count = ?, children_count = ?, child_ages = ?, approx_budget = ?, total_amount = ?,
        notes = ?, comments = ?, reminder_setting = ?, description = ?
    WHERE leadid = ?`;

  db.query(updateOpportunityQuery, [
    opportunityData.origincity,
    opportunityData.destination,
    opportunityData.start_date,
    opportunityData.end_date,
    opportunityData.duration,
    opportunityData.adults_count,
    opportunityData.children_count,
    opportunityData.child_ages,
    opportunityData.approx_budget,
    opportunityData.approx_budget,
    opportunityData.notes,
    opportunityData.comments,
    opportunityData.reminder_setting,
    opportunityData.description,
    leadid,
  ], (err, result) => {
    if (err) {
      return callback(err, null);
    }

    if (result.affectedRows === 0) {
      return callback(null, { affectedRows: 0 }); // No lead found
    }

    // Step 2: Fetch the customer ID related to this lead
    const getCustomerIdQuery = `SELECT customerid FROM addleads WHERE leadid = ?`;

    db.query(getCustomerIdQuery, [leadid], (err, leadResults) => {
      if (err) {
        return callback(err, null);
      }

      if (leadResults.length === 0 || !leadResults[0].customerid) {
        return callback(null, result); // No customer associated with this lead
      }

      const customerid = leadResults[0].customerid;

      // Step 3: Update the `origincity` in the `customers` table
      const updateCustomerCityQuery = `UPDATE customers SET origincity = ? WHERE id = ?`;

      db.query(updateCustomerCityQuery, [opportunityData.origincity, customerid], (err, customerUpdateResult) => {
        if (err) {
          return callback(err, null);
        }
        return callback(null, result);
      });
    });
  });
};

module.exports = { updateOpportunity };


module.exports = {
  updateLead,
  updateOpportunity,
};
