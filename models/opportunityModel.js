const db = require('../config/db');

const Opportunity = {
  createOpportunity: (data, callback) => {
    const query = `
      INSERT INTO travel_opportunity (
        leadid, customerid, origincity,destination, start_date, end_date, duration, adults_count, 
        children_count, child_ages, approx_budget, 	total_amount, assignee, notes,description, comments, 
        reminder_setting, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?,?,?, NOW(), NOW())
    `;
    db.query(query, data, callback);
  },
  
  // updateCustomerStatus: (customerid, status, callback) => {
  //   const query = 'UPDATE customers SET customer_status = ? WHERE id = ?';
  //   db.query(query, [status, customerid], callback);
  // },

  updateCustomerStatus: (customerid, status, origincity, callback) => {
    const query = 'UPDATE customers SET customer_status = ?, origincity = ? WHERE id = ?';
    db.query(query, [status, origincity, customerid], callback);
  },
  

  deleteOpportunityByLeadId: (leadid, callback) => {
    // Start a transaction
    db.beginTransaction((err) => {
      if (err) {
        return callback(err);
      }
  
      // First delete from addleads
      const query1 = 'DELETE FROM addleads WHERE leadid = ?';
      db.query(query1, [leadid], (error1, results1) => {
        if (error1) {
          return db.rollback(() => {
            callback(error1);
          });
        }
  
        // Then delete from travel_opportunity
        const query2 = 'DELETE FROM travel_opportunity WHERE leadid = ?';
        db.query(query2, [leadid], (error2, results2) => {
          if (error2) {
            return db.rollback(() => {
              callback(error2);
            });
          }
  
          // Commit the transaction
          db.commit((commitError) => {
            if (commitError) {
              return db.rollback(() => {
                callback(commitError);
              });
            }
            callback(null, { message: 'Deleted successfully from both tables.' });
          });
        });
      });
    });
  },

  fetchLeadWithOpportunity: (leadid, callback) => {
    const query = `
      SELECT addleads.*, travel_opportunity.* 
      FROM addleads
      INNER JOIN travel_opportunity
      ON addleads.leadid = travel_opportunity.leadid
      WHERE addleads.leadid = ?
    `;
    db.query(query, [leadid], callback);
  },


  updateOpportunityStatus: (leadId, data, callback) => {
    let query = 'UPDATE addleads SET ';
    const params = [];
  
    if (data.opportunity_status1 !== undefined) {
      query += 'opportunity_status1 = ?, ';
      params.push(data.opportunity_status1);
    }
    if (data.opportunity_status2 !== undefined) {
      query += 'opportunity_status2 = ?, ';
      params.push(data.opportunity_status2);
    }
  
    query = query.slice(0, -2); // Remove trailing comma
    query += ' WHERE leadid = ?';
    params.push(leadId);
  
    db.query(query, params, callback);
  },

 
};




  
module.exports = Opportunity;
