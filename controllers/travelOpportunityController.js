const travelOpportunityModel = require('../models/travelOpportunityModel');
const db = require('../config/db'); 

// Controller to fetch all travel opportunities
const getTravelOpportunities = (req, res) => {
  travelOpportunityModel.getAllTravelOpportunities((error, results) => {
    if (error) {
      console.error('Error fetching travel opportunities:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }

    // Check if results contain any data
    if (results.length > 0) {
      // Send all records together in the response
      const formattedResults = results.map(result => ({
        id: result.id,
        leadid: result.leadid,
        destination: result.destination,
        start_date: result.start_date,
        end_date: result.end_date,
        duration: result.duration,
        adults_count: result.adults_count,
        children_count: result.children_count,
        child_ages: result.child_ages,
        approx_budget: result.approx_budget,
        assignee: result.assignee,
        notes: result.notes,
        comments: result.comments,
        reminder_setting: result.reminder_setting,
      }));

      // Send the formatted results as a single response
      res.status(200).json(formattedResults);  // All records in a single response
    } else {
      res.status(404).json({ message: 'No travel opportunities found' });
    }
  });
};

// PUT controller to update approx_budget
const updateTravelOpportunity = (req, res) => {
  const opportunityId = req.params.id;
  const { approx_budget, leadid, userid } = req.body;

  if (!approx_budget || isNaN(approx_budget)) {
      return res.status(400).json({ error: 'Invalid approx_budget' });
  }

  // Update the budget in travel_opportunity
  travelOpportunityModel.updateApproxBudget(opportunityId, approx_budget, (error, result) => {
      if (error) {
          console.error("Update failed:", error);
          return res.status(500).json({ error: 'Failed to update approx_budget' });
      }

     

      const insertQuery = `
          INSERT INTO total_amount_history (leadid, total_amount, userid)
          VALUES (?, ?, ?)
      `;

      db.query(insertQuery, [leadid, approx_budget, userid], (err, result) => {
          if (err) {
              console.error("Failed to log history:", err);
              return res.status(500).json({ error: 'Updated but failed to log history' });
          }

          return res.json({ message: 'Approx budget updated and history logged' });
      });
  });
};



module.exports = {
  getTravelOpportunities,
  updateTravelOpportunity,
};
