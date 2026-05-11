const db = require('../config/db'); // Import the database connection

// Fetch data from addleads table
const getAddLeadsByLeadId = (leadId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM addleads WHERE leadid = ?;`;
    db.query(query, [leadId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]); // Assuming leadId is unique
    });
  });
};

// Fetch data from travel_opportunity table
const getTravelOpportunitiesByLeadId = (leadId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM travel_opportunity WHERE leadid = ?;`;
    db.query(query, [leadId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Fetch data from comments table
const getCommentsByLeadId = (leadId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM comments WHERE leadid = ?;`;
    db.query(query, [leadId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Export model functions
module.exports = {
  getAddLeadsByLeadId,
  getTravelOpportunitiesByLeadId,
  getCommentsByLeadId,
};
