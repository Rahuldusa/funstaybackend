const db = require('../config/db');

const fetchLeadData = async (req, res) => {
  const { leadid } = req.params;

  // Queries for fetching data
  const queries = {
    addLeads: 'SELECT * FROM addleads WHERE leadid = ?',
    travelOpportunities: 'SELECT * FROM travel_opportunity WHERE leadid = ?',
    comments: 'SELECT * FROM comments WHERE leadid = ?',
  };

  try {
    // Execute all queries in parallel
    const [lead, travelOpportunities, comments] = await Promise.all([
      new Promise((resolve, reject) => {
        db.query(queries.addLeads, [leadid], (err, results) => {
          if (err) reject(err);
          else resolve(results.length > 0 ? results[0] : null); // Return first row or null
        });
      }),
      new Promise((resolve, reject) => {
        db.query(queries.travelOpportunities, [leadid], (err, results) => {
          if (err) reject(err);
          else resolve(results.length > 0 ? results : []); // Return all rows or empty array
        });
      }),
      new Promise((resolve, reject) => {
        db.query(queries.comments, [leadid], (err, results) => {
          if (err) reject(err);
          else resolve(results.length > 0 ? results : []); // Return all rows or empty array
        });
      }),
    ]);

    // Send combined data as the response
    res.json({
      lead: lead || null,
      travelOpportunities: travelOpportunities || [],
      comments: comments || [],
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

module.exports = { fetchLeadData };
