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

// router.put('/travel-opportunity/:id', (req, res) => {
//     const { id } = req.params;
//     const { reminder_setting, notes, userId } = req.body;
//     const query = `
//       UPDATE travel_opportunity 
//       SET reminder_setting = ?, notes = ?, User_id = ?
//       WHERE id = ?
//     `;
  
//     db.query(query, [reminder_setting, notes, userId, id], (err, result) => {
//       if (err) {
//         console.error('DB Update Error:', err);
//         return res.status(500).json({ message: 'Database error', error: err });
//       }
//       res.json({ message: 'Updated successfully' });
//     });
//   });

router.put('/travelopportunity-setting/:id', (req, res) => {
  const { id } = req.params;
  const { reminder_setting, notes, userId, action } = req.body;
  console.log("Params:", req.params);   
  console.log("Body:", req.body);      

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  const getLeadQuery = `SELECT leadid FROM travel_opportunity WHERE id = ?`;

  db.query(getLeadQuery, [id], (err, result) => {
    if (err) {
      console.error('Fetch leadid error:', err);
      return res.status(500).json({ message: 'Fetch leadid failed', error: err.message });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const leadId = result[0].leadid; 

  const updateTravelOpportunityQuery = `
  UPDATE travel_opportunity 
  SET reminder_setting = ?, 
      notes = ? 
  WHERE id = ?
`;

const reminderValue = reminder_setting && reminder_setting !== '' 
  ? reminder_setting 
  : null;

const notesValue = notes && notes.trim() !== '' 
  ? notes.trim() 
  : null;

db.query(updateTravelOpportunityQuery, [reminderValue, notesValue, id], (err, updateResult) => {
  if (err) {
    console.error('Update travel_opportunity error:', err);
    return res.status(500).json({ message: 'Update travel_opportunity failed', error: err.message });
  }

      // Insert into reminder_settings table
      const insertQuery = `
        INSERT INTO reminder_settings 
        (lead_id, travel_opportunity_id, reminder_setting, notes, user_id, action)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const notesValue = notes && notes.trim() !== '' ? notes.trim() : null;
      
      db.query(insertQuery, [leadId, id, reminderValue, notesValue, userId, action], (err, insertResult) => {
        if (err) {
          console.error('Insert error:', err);
          return res.status(500).json({ message: 'Insert failed', error: err.message });
        }

        res.json({ 
          message: 'Reminder saved and travel_opportunity updated successfully', 
          id: insertResult.insertId 
        });
      });
    });
  });
});
router.put('/travelopportunity-setting/by-lead/:leadid', (req, res) => {
  const { leadid } = req.params;
  const { reminder_setting, notes, userId } = req.body;
  
  console.log("Lead ID:", leadid);   
  console.log("Body:", req.body);      

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  const insertQuery = `
    INSERT INTO reminder_settings 
    (lead_id, reminder_setting, notes, user_id)
    VALUES (?, ?, ?, ?)
  `;
  
  const reminderValue = reminder_setting && reminder_setting !== '' ? reminder_setting : null;
  const notesValue = notes && notes.trim() !== '' ? notes.trim() : null;
  
  db.query(insertQuery, [leadid, reminderValue, notesValue, userId], (err, insertResult) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ message: 'Insert failed', error: err.message });
    }
    
    res.json({ 
      message: 'Reminder saved successfully', 
      id: insertResult.insertId
    });
  });
});


router.put('/travelopportunity-actions/:id', (req, res) => {
  const { id } = req.params; // travel_opportunity_id
  const { userId, action } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  // ✅ Normalize action (avoid NULL)
  const finalAction = action && action.trim() !== '' ? action : '';

  // 🔥 STEP 1: Find latest row WHERE action IS NULL
  const getNullRow = `
    SELECT * FROM reminder_settings
    WHERE travel_opportunity_id = ?
    AND user_id = ?
    AND action IS NULL
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(getNullRow, [id, userId], (err, nullRows) => {
    if (err) {
      return res.status(500).json({
        message: 'Fetch failed',
        error: err.message
      });
    }

    // ✅ CASE 1: UPDATE existing NULL action row
    if (nullRows.length > 0) {
      const updateQuery = `
        UPDATE reminder_settings
        SET action = ?, updated_at = NOW()
        WHERE id = ?
      `;

      return db.query(updateQuery, [finalAction, nullRows[0].id], (err) => {
        if (err) {
          return res.status(500).json({
            message: 'Update failed',
            error: err.message
          });
        }

        return res.json({
          message: 'Updated NULL action row',
          id: nullRows[0].id
        });
      });
    }

    // 🔥 STEP 2: Get latest row to COPY lead_id + notes
    const getLatestRow = `
      SELECT * FROM reminder_settings
      WHERE travel_opportunity_id = ?
      AND user_id = ?
      ORDER BY id DESC
      LIMIT 1
    `;

    db.query(getLatestRow, [id, userId], (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: 'Fetch latest failed',
          error: err.message
        });
      }

      let leadId = null;
      let notes = '';

      if (rows.length > 0) {
        leadId = rows[0].lead_id;
        notes = rows[0].notes || '';
      }

      // ✅ INSERT new row
      const insertQuery = `
        INSERT INTO reminder_settings
        (lead_id, travel_opportunity_id, user_id, action, reminder_setting, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), ?, NOW(), NOW())
      `;

      db.query(
        insertQuery,
        [leadId, id, userId, finalAction, notes],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              message: 'Insert failed',
              error: err.message
            });
          }

          return res.json({
            message: 'Inserted correctly',
            id: result.insertId
          });
        }
      );
    });
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


router.get('/allleads-report', (req, res) => {
  const query = `
    SELECT 
      a.*,
      GROUP_CONCAT(t.label ORDER BY t.id SEPARATOR ',') AS tag_names
    FROM addleads a
    LEFT JOIN customers c ON a.customerid = c.id
    LEFT JOIN tags t ON 
      FIND_IN_SET(
        t.id, 
        REPLACE(REPLACE(REPLACE(c.tags, '[', ''), ']', ''), ' ', '')
      ) > 0
    WHERE a.status = 'lead'
    GROUP BY a.leadid
    ORDER BY a.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('DB Fetch Error:', err);
      return res.status(500).json({
        message: 'Failed to fetch leads report',
        error: err
      });
    }

    // Convert comma-separated tag_names into array
    const dataWithTags = results.map(row => ({
      ...row,
      tag_names: row.tag_names ? row.tag_names.split(',') : []
    }));

    res.status(200).json({
      message: 'Leads report fetched successfully',
      count: results.length,
      data: dataWithTags
    });
  });
});

// Manager get api


router.get('/allleads-report-manager/:managerid', (req, res) => {
    console.log("Params:", req.params);   // URL params
  console.log("Body:", req.body);       // Request body
  console.log("Query:", req.query);   
  const { managerid } = req.params;

  const query = `
    SELECT 
      a.*,
      GROUP_CONCAT(t.label ORDER BY t.id SEPARATOR ',') AS tag_names
    FROM addleads a
    LEFT JOIN customers c ON a.customerid = c.id
    LEFT JOIN tags t ON 
      FIND_IN_SET(
        t.id, 
        REPLACE(REPLACE(REPLACE(c.tags, '[', ''), ']', ''), ' ', '')
      ) > 0
    WHERE a.status = 'lead'
    AND a.managerid = ?
    GROUP BY a.leadid
    ORDER BY a.created_at DESC
  `;

  db.query(query, [managerid], (err, results) => {
    if (err) {
      console.error('DB Fetch Error:', err);
      return res.status(500).json({
        message: 'Failed to fetch leads report',
        error: err
      });
    }

    const dataWithTags = results.map(row => ({
      ...row,
      tag_names: row.tag_names ? row.tag_names.split(',') : []
    }));

    res.status(200).json({
      message: 'Leads report fetched successfully',
      count: results.length,
      data: dataWithTags
    });
  });
});


// employee get api
router.get('/allleads-employee-report/:userId', (req, res) => {
  const { userId } = req.params; // Get userId from URL parameter
  
  const query = `
    SELECT 
      a.*,
      GROUP_CONCAT(t.label ORDER BY t.id SEPARATOR ',') AS tag_names
    FROM addleads a
    LEFT JOIN customers c ON a.customerid = c.id
    LEFT JOIN tags t ON 
      FIND_IN_SET(
        t.id, 
        REPLACE(REPLACE(REPLACE(c.tags, '[', ''), ']', ''), ' ', '')
      ) > 0
    WHERE a.status = 'lead'
    AND a.assignedSalesId = ?
    GROUP BY a.leadid
    ORDER BY a.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('DB Fetch Error:', err);
      return res.status(500).json({
        message: 'Failed to fetch leads report',
        error: err
      });
    }

    // Convert comma-separated tag_names into array
    const dataWithTags = results.map(row => ({
      ...row,
      tag_names: row.tag_names ? row.tag_names.split(',') : []
    }));

    res.status(200).json({
      message: 'Leads report fetched successfully',
      count: results.length,
      data: dataWithTags
    });
  });
});

module.exports = router;
