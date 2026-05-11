const Opportunity = require('../models/opportunityModel');
const Lead = require('../models/leadModel'); // To update lead status when creating an opportunity
const db = require('../config/db');
// exports.createOpportunity = (req, res) => {
//   const {
//     leadid,
//     customerid, // Add customerid to the destructured request body
//     destination,
//     start_date,
//     end_date,
//     duration,
//     adults_count,
//     children_count,
//     child_ages,
//     approx_budget,
//     assignee,
//     notes,
//     comments,
//     reminder_setting,
//   } = req.body;

//   const opportunityData = [
//     leadid,
//     customerid, // Include customerid in the opportunityData array
//     destination,
//     start_date,
//     end_date,
//     duration,
//     adults_count,
//     children_count,
//     child_ages,
//     approx_budget,
//     assignee,
//     notes,
//     comments,
//     reminder_setting,
//   ];

//   // Start a transaction
//   db.beginTransaction((err) => {
//     if (err) {
//       console.error('Error starting transaction:', err);
//       return res.status(500).json({ message: 'Error starting transaction' });
//     }

//     // Insert opportunity
//     Opportunity.createOpportunity(opportunityData, (err, result) => {
//       if (err) {
//         console.error('Error creating opportunity:', err);
//         return db.rollback(() => {
//           res.status(500).json({ message: 'Failed to create opportunity.' });
//         });
//       }

//       // Update lead status to "opportunity" in addleads table
//       Lead.updateLeadStatusOpp(leadid, 'opportunity', (err) => {
//         if (err) {
//           console.error('Error updating lead status:', err);
//           return db.rollback(() => {
//             res.status(500).json({ message: 'Failed to update lead status.' });
//           });
//         }

//         // Update customer status to "existing" in customers table
//         Opportunity.updateCustomerStatus(customerid, 'existing', (err) => {
//           if (err) {
//             console.error('Error updating customer status:', err);
//             return db.rollback(() => {
//               res.status(500).json({ message: 'Failed to update customer status.' });
//             });
//           }

//           // Commit transaction
//           db.commit((err) => {
//             if (err) {
//               console.error('Error committing transaction:', err);
//               return db.rollback(() => {
//                 res.status(500).json({ message: 'Failed to commit transaction.' });
//               });
//             }

//             res.status(201).json({
//               message: 'Opportunity created successfully, lead status updated, and customer status updated.',
//               opportunityId: result.insertId,
//             });
//           });
//         });
//       });
//     });
//   });
// };


exports.createOpportunity = (req, res) => {
  const {
    leadid,
    customerid, // Add customerid to the destructured request body
    origincity,
    destination,
    start_date,
    end_date,
    duration,
    adults_count,
    children_count,
    child_ages,
    approx_budget,
    assignee,
    notes,
    description,
    comments,
    reminder_setting,
  } = req.body;

  const opportunityData = [
    leadid,
    customerid, // Include customerid in the opportunityData array
    origincity,
    destination,
    start_date,
    end_date,
    duration,
    adults_count,
    children_count,
    child_ages,
    approx_budget,
    approx_budget,
    assignee,
    notes,
    description,
    comments,
    reminder_setting,
  ];

  // Start a transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ message: 'Error starting transaction' });
    }

    // Insert opportunity
    Opportunity.createOpportunity(opportunityData, (err, result) => {
      if (err) {
        console.error('Error creating opportunity:', err);
        return db.rollback(() => {
          res.status(500).json({ message: 'Failed to create opportunity.' });
        });
      }

      // Update lead status to "opportunity" in addleads table
      Lead.updateLeadStatusOpp(leadid, 'opportunity', (err) => {
        if (err) {
          console.error('Error updating lead status:', err);
          return db.rollback(() => {
            res.status(500).json({ message: 'Failed to update lead status.' });
          });
        }

        // Update customer status to "existing" in customers table
        // Opportunity.updateCustomerStatus(customerid, 'existing', (err) => {
        //   if (err) {
        //     console.error('Error updating customer status:', err);
        //     return db.rollback(() => {
        //       res.status(500).json({ message: 'Failed to update customer status.' });
        //     });
        //   }
        // Update customer status and origin city in customers table
Opportunity.updateCustomerStatus(customerid, 'existing', origincity, (err) => {
  if (err) {
    console.error('Error updating customer status and origin city:', err);
    return db.rollback(() => {
      res.status(500).json({ message: 'Failed to update customer status and origin city.' });
    });
  }


          // Update opportunity statuses in the addleads table
          const opportunityStatus1 = "In Progress";
          const opportunityStatus2 = "Understood Requirement";

          Lead.OpportunityStatuses(leadid, opportunityStatus1, opportunityStatus2, (err) => {
            if (err) {
              console.error('Error updating opportunity statuses in addleads:', err);
              return db.rollback(() => {
                res.status(500).json({ message: 'Failed to update opportunity statuses in addleads.' });
              });
            }

            // Commit transaction
            db.commit((err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                return db.rollback(() => {
                  res.status(500).json({ message: 'Failed to commit transaction.' });
                });
              }

              res.status(201).json({
                message: 'Opportunity created successfully, lead status updated, customer status updated, and opportunity statuses updated.',
                opportunityId: result.insertId,
              });
            });
          });
        });
      });
    });
  });
};
exports.deleteOpportunityByLeadId = (req, res) => {
  const { leadid } = req.params;

  Opportunity.deleteOpportunityByLeadId(leadid, (err, result) => {
    if (err) {
      console.error('Error deleting opportunity:', err);
      return res.status(500).json({ message: 'Failed to delete opportunity.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Opportunity not found.' });
    }

    res.status(200).json({ message: 'Opportunity deleted successfully.' });
  });
};

exports.fetchLeadWithOpportunity = (req, res) => {
  const { leadid } = req.params;

  Opportunity.fetchLeadWithOpportunity(leadid, (err, results) => {
    if (err) {
      console.error('Error fetching lead with opportunity:', err);
      return res.status(500).json({ message: 'Failed to fetch data.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No data found for this lead.' });
    }

    res.status(200).json(results[0]);
  });
};

exports.updateOpportunityStatus = (req, res) => {
  const { leadId } = req.params;
  const { opportunity_status1, opportunity_status2 } = req.body;


  if (!opportunity_status1 && !opportunity_status2) {
    return res.status(400).json({ message: 'At least one status field is required.' });
  }

  let query = 'UPDATE addleads SET ';
  const params = [];

  if (opportunity_status1 !== undefined) {
    query += 'opportunity_status1 = ?, ';
    params.push(opportunity_status1);
  }
  if (opportunity_status2 !== undefined) {
    query += 'opportunity_status2 = ?, ';
    params.push(opportunity_status2);
  }
 // Add the timestamp for status update
  query += 'status_updated_at = NOW(), ';
  // Remove trailing comma and space
  query = query.slice(0, -2);
  query += ' WHERE leadid = ?';
  params.push(leadId);

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error updating opportunity status:', err);
      return res.status(500).json({ message: 'Failed to update opportunity status.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Opportunity not found.' });
    }

    res.status(200).json({ message: 'Opportunity status updated successfully.' });
  });
};

