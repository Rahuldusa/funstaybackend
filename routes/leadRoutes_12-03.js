const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const db = require('../config/db');

const { assignLead , adminassignLead } = require('../controllers/employeeController');


const { fetchLeadData } = require('../controllers/leadOppCommentController');

router.post('/leads', leadController.createLead);
router.post('/managerleads', leadController.managercreateLead);
router.post('/adminleads', leadController.admincreateLead);
router.get('/allleads', leadController.getAllLeads);
router.get('/leads/:leadid', leadController.getLeadById);
router.put('/leads/update/:leadid', leadController.updateLead);
router.delete('/deleteByLeadId/:leadid', leadController.deleteLead);
router.put('/leads/status/:leadid', leadController.updateLeadStatus);
router.get('/lead-opp-comment/:leadid', leadController.getLeadData);


router.put('/archiveByLeadId/:leadid', leadController.archiveLead);

router.post('/assign-lead', assignLead);


//leadoppcomments
router.get('/leadsoppcomment/:leadid', fetchLeadData);



router.post('/admin-assign-lead', adminassignLead);

router.put('/travel-opportunity/:id', (req, res) => {
    const { id } = req.params;
    const { reminder_setting, notes } = req.body;
  
    const query = `
      UPDATE travel_opportunity 
      SET reminder_setting = ?, notes = ? 
      WHERE id = ?
    `;
  
    db.query(query, [reminder_setting, notes, id], (err, result) => {
      if (err) {
        console.error('DB Update Error:', err); // Log the exact error
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.json({ message: 'Updated successfully' });
    });
  });

router.get('/addleads/statuslead', (req, res) => {
  const query = `
    SELECT
         leadid, name, email, phone_number, sources,
         primaryStatus, secondaryStatus, customer_status, destination,
         assignedSalesId, assignedSalesName, assign_to_manager,
         managerid, adminAssign, managerAssign, archive FROM addleads 
    WHERE status = ?
    ORDER BY created_at DESC
  `;

  db.query(query, ['lead'], (err, result) => {
    if (err) {
      console.error('DB Fetch Error:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    res.json({
      message: 'Fetched successfully',
      count: result.length,
      data: result
    });
  });
});


router.get('/addleads/last7days', (req, res) => {
  const query = `
    SELECT *
    FROM addleads
    WHERE status = 'lead'
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    ORDER BY created_at DESC
  `;

  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    res.json({
      data: result
    });
  });
});



module.exports = router;
