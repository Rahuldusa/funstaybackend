// routes/leadRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get leads for a specific manager for today
router.get('/lead/today/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const today = new Date().toISOString().split('T')[0];
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE DATE(created_at) = ? AND assignedSalesId = ?
  `;
  
  console.log(`Querying leads for today: ${today}, assignedSalesId: ${assignedSalesId}`); // Debugging line

  db.query(query, [today, assignedSalesId], (err, results) => {
    if (err) {
      console.error("Error querying leads:", err); // Log the error
      return res.status(500).json({ error: err.message });
    }
    console.log("Results:", results); // Log the results
    res.json({ count: results[0].count });
  });
});

// Get confirmed leads for a specific manager for today
router.get('/lead/confirmed/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const today = new Date().toISOString().split('T')[0];
  const query = `
  SELECT COUNT(*) AS count 
  FROM addleads a
  JOIN travel_opportunity t ON a.leadid = t.leadid
  WHERE a.status = 'opportunity' 
    AND DATE(t.created_at) = ? 
    AND a.assignedSalesId = ?
`;

  
  db.query(query, [today, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get in-progress leads for a specific manager for today
router.get('/lead/in-progress/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const today = new Date().toISOString().split('T')[0];
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE status = 'lead' AND DATE(created_at) = ? AND assignedSalesId = ?
  `;
  
  db.query(query, [today, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get leads for a specific manager for yesterday
router.get('/lead/yesterday/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateString = yesterday.toISOString().split('T')[0];
  
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE DATE(created_at) = ? AND assignedSalesId = ?
  `;
  
  db.query(query, [dateString, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get confirmed leads for a specific manager for yesterday
router.get('/lead/confirmed/yesterday/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateString = yesterday.toISOString().split('T')[0];
  
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE status = 'opportunity' AND DATE(created_at) = ? AND assignedSalesId = ?
  `;
  
  db.query(query, [dateString, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get in-progress leads for a specific manager for yesterday
router.get('/lead/in-progress/yesterday/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateString = yesterday.toISOString().split('T')[0];
  
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE status = 'lead' AND DATE(created_at) = ? AND assignedSalesId = ?
  `;
  
  db.query(query, [dateString, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get count of leads with lead_type 'Meta Ads' for a specific manager
router.get('/lead/meta-ads/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE lead_type = 'Meta Ads' AND assignedSalesId = ?
  `;
  
  db.query(query, [assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get count of leads with lead_type not equal to 'Meta Ads' for a specific manager
router.get('/lead/not-meta-ads/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE lead_type != 'Meta Ads' AND assignedSalesId = ?
  `;
  
  db.query(query, [assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/lead/facebook/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE sources = 'fb' AND assignedSalesId = ?
  `;
  
  db.query(query, [assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/lead/referral/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE primarySource = 'Referral' AND assignedSalesId = ?
  `;
  
  db.query(query, [assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/lead/campaign/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE channel = 'Website' AND assignedSalesId = ?
  `;
  
  db.query(query, [assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/lead/google/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE primarySource = 'Google' AND assignedSalesId = ?
  `;
  
  db.query(query, [assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/lead/others/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE assignedSalesId = ? 
       AND (primarySource NOT IN ('Google', 'Referral') OR primarySource IS NULL)
  AND (sources NOT IN ('fb', 'Facebook') OR sources IS NULL)
  AND (channel IS NULL OR channel != 'Website');
  `;

  db.query(query, [assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/lead/weekly/sales/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;

  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const startDate = sunday.toISOString().split('T')[0];
  const endDate = saturday.toISOString().split('T')[0];

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE DATE(created_at) BETWEEN ? AND ? 
    AND assignedSalesId = ?
  `;

  console.log(`Weekly leads from ${startDate} to ${endDate} for assignedSalesId: ${assignedSalesId}`);

  db.query(query, [startDate, endDate, assignedSalesId], (err, results) => {
    if (err) {
      console.error("Error querying weekly leads:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ week_start: startDate, week_end: endDate, count: results[0].count });
  });
});

router.get('/lead/monthly/sales/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentMonth = `${year}-${month}`;

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE DATE_FORMAT(created_at, '%Y-%m') = ? 
    AND assignedSalesId = ?
  `;

  console.log(`Monthly leads for ${currentMonth} for assignedSalesId: ${assignedSalesId}`);

  db.query(query, [currentMonth, assignedSalesId], (err, results) => {
    if (err) {
      console.error("Error querying monthly leads:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ month: currentMonth, count: results[0].count });
  });
});


router.get('/lead/confirmed/weekly/sales/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;

  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const startDate = sunday.toISOString().split('T')[0];
  const endDate = saturday.toISOString().split('T')[0];

  const query = `
  SELECT COUNT(*) AS count 
  FROM addleads a
  JOIN travel_opportunity t ON a.leadid = t.leadid
  WHERE a.status = 'opportunity' 
    AND DATE(t.created_at) BETWEEN ? AND ? 
    AND a.assignedSalesId = ?
`;


  db.query(query, [startDate, endDate, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      count: results[0].count
    });
  });
});

router.get('/lead/confirmed/monthly/sales/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentMonth = `${year}-${month}`;

  const query = `
  SELECT COUNT(*) AS count 
  FROM addleads a
  JOIN travel_opportunity t ON a.leadid = t.leadid
  WHERE a.status = 'opportunity' 
    AND DATE_FORMAT(t.created_at, '%Y-%m') = ? 
    AND a.assignedSalesId = ?
`;


  db.query(query, [currentMonth, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: currentMonth,
      count: results[0].count
    });
  });
});

router.get('/opps/confirmed/today/sales/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE opportunity_status1 = 'Confirmed' 
    AND DATE(status_updated_at) = ? AND assignedSalesId = ?
  `;

  db.query(query, [today, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ assignedSalesId, count: results[0].count });
  });
});
router.get('/opps/confirmed/weekly/sales/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const startDate = sunday.toISOString().split('T')[0];
  const endDate = saturday.toISOString().split('T')[0];

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE opportunity_status1 = 'Confirmed' 
    AND DATE(status_updated_at) BETWEEN ? AND ? AND assignedSalesId = ?
  `;

  db.query(query, [startDate, endDate, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      assignedSalesId,
      count: results[0].count,
    });
  });
});
router.get('/opps/confirmed/monthly/sales/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE opportunity_status1 = 'Confirmed' 
    AND DATE_FORMAT(status_updated_at, '%Y-%m') = ? AND assignedSalesId = ?
  `;

  db.query(query, [`${year}-${month}`, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: `${year}-${month}`,
      assignedSalesId,
      count: results[0].count,
    });
  });
});
router.get('/hots/today/sales/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT COUNT(*) AS count
    FROM addleads a
    WHERE a.leadid IN (
      SELECT t.leadid
      FROM travel_opportunity t
      WHERE t.tag = 'Hot' AND DATE(t.tagged_date) = ?
    )
    AND a.assignedSalesId = ?
  `;

  db.query(query, [today, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ date: today, assignedSalesId, count: results[0].count });
  });
});
router.get('/hots/weekly/sales/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const startDate = sunday.toISOString().split('T')[0];
  const endDate = saturday.toISOString().split('T')[0];

  const query = `
    SELECT COUNT(*) AS count
    FROM addleads a
    WHERE a.leadid IN (
      SELECT t.leadid
      FROM travel_opportunity t
      WHERE t.tag = 'Hot' 
      AND DATE(t.tagged_date) BETWEEN ? AND ?
    )
    AND a.assignedSalesId = ?
  `;

  db.query(query, [startDate, endDate, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ week_start: startDate, week_end: endDate, assignedSalesId, count: results[0].count });
  });
});
router.get('/hots/monthly/sales/:assignedSalesId', (req, res) => {
  const { assignedSalesId } = req.params;
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const query = `
    SELECT COUNT(*) AS count
    FROM addleads a
    WHERE a.leadid IN (
      SELECT t.leadid
      FROM travel_opportunity t
      WHERE t.tag = 'Hot' 
      AND DATE_FORMAT(t.tagged_date, '%Y-%m') = ?
    )
    AND a.assignedSalesId = ?
  `;

  db.query(query, [`${year}-${month}`, assignedSalesId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ month: `${year}-${month}`, assignedSalesId, count: results[0].count });
  });
});

module.exports = router;