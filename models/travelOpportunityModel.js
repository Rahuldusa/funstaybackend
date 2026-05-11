const db = require('../config/db'); // Assuming you have a DB config file

// Fetch all travel opportunities with additional fields
const getAllTravelOpportunities = (callback) => {
  const query = `
    SELECT id,leadid, destination, start_date, end_date, duration, adults_count, 
           children_count, child_ages, approx_budget, assignee, notes, 
           comments, reminder_setting
    FROM travel_opportunity
  `;
  
  db.query(query, (error, results) => {
    if (error) {
      return callback(error, null);
    }
    callback(null, results);
  });
};

// New model method to update approx_budget
const updateApproxBudget = (id, approx_budget, callback) => {
  const query = `
    UPDATE travel_opportunity 
    SET approx_budget = ? 
    WHERE id = ?
  `;
  db.query(query, [approx_budget, id], (error, result) => {
    if (error) return callback(error, null);
    callback(null, result);
  });
};

module.exports = {
  getAllTravelOpportunities,
  updateApproxBudget,
};
