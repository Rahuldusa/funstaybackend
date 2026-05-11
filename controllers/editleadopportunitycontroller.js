const { updateLead, updateOpportunity } = require("../models/editleadoppModel");

const updateLeadById = (req, res) => {
  const { leadid } = req.params;
  const leadData = req.body;

  updateLead(leadid, leadData, (err, results) => {
    if (err) {
      console.error("Error updating lead:", err);
      return res.status(500).json({ message: "Failed to update lead" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.status(200).json({ message: "Lead updated successfully" });
  });
};

const updateOpportunityById = (req, res) => {
  const { leadid } = req.params;
  const opportunityData = req.body;

  updateOpportunity(leadid, opportunityData, (err, results) => {
    if (err) {
      console.error("Error updating opportunity:", err);
      return res.status(500).json({ message: "Failed to update opportunity" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Opportunity not found" });
    }
    res.status(200).json({ message: "Opportunity and Customer updated successfully" });
  });
};

module.exports = {
  updateLeadById,
  updateOpportunityById,
};
