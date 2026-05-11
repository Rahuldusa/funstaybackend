// routes/leadRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get leads for a specific manager for today
router.get('/leads/today/:managerid', (req, res) => {
  const { managerid } = req.params;
  const today = new Date().toISOString().split('T')[0];
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE DATE(created_at) = ? AND managerid = ?
  `;
  
  db.query(query, [today, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get confirmed leads for a specific manager for today
router.get('/leads/confirmed/:managerid', (req, res) => {
  const { managerid } = req.params;
  const today = new Date().toISOString().split('T')[0];
  const query = `
  SELECT COUNT(*) AS count 
  FROM addleads a
  JOIN travel_opportunity t ON a.leadid = t.leadid
  WHERE a.status = 'opportunity' 
    AND DATE(t.created_at) = ? 
    AND a.managerid = ?
`;

  
  db.query(query, [today, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get in-progress leads for a specific manager for today
router.get('/leads/in-progress/:managerid', (req, res) => {
  const { managerid } = req.params;
  const today = new Date().toISOString().split('T')[0];
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE status = 'lead' AND DATE(created_at) = ? AND managerid = ?
  `;
  
  db.query(query, [today, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get leads for a specific manager for yesterday
router.get('/leads/yesterday/:managerid', (req, res) => {
  const { managerid } = req.params;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateString = yesterday.toISOString().split('T')[0];
  
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE DATE(created_at) = ? AND managerid = ?
  `;
  
  db.query(query, [dateString, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get confirmed leads for a specific manager for yesterday
router.get('/leads/confirmed/yesterday/:managerid', (req, res) => {
  const { managerid } = req.params;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateString = yesterday.toISOString().split('T')[0];
  
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE status = 'opportunity' AND DATE(created_at) = ? AND managerid = ?
  `;
  
  db.query(query, [dateString, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get in-progress leads for a specific manager for yesterday
router.get('/leads/in-progress/yesterday/:managerid', (req, res) => {
  const { managerid } = req.params;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateString = yesterday.toISOString().split('T')[0];
  
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE status = 'lead' AND DATE(created_at) = ? AND managerid = ?
  `;
  
  db.query(query, [dateString, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get count of leads with lead_type 'Meta Ads' for a specific manager
router.get('/leads/meta-ads/:managerid', (req, res) => {
  const { managerid } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE lead_type = 'Meta Ads' AND managerid = ?
  `;
  
  db.query(query, [managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

// Get count of leads with lead_type not equal to 'Meta Ads' for a specific manager
router.get('/leads/not-meta-ads/:managerid', (req, res) => {
  const { managerid } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE lead_type != 'Meta Ads' AND managerid = ?
  `;
  
  db.query(query, [managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/leads/facebook/:managerid', (req, res) => {
  const { managerid } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE sources = 'fb' AND managerid = ?
  `;
  
  db.query(query, [managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/leads/referral/:managerid', (req, res) => {
  const { managerid } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE primarySource = 'Referral' AND managerid = ?
  `;
  
  db.query(query, [managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/leads/campaign/:managerid', (req, res) => {
  const { managerid } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE channel = 'Website' AND managerid = ?
  `;
  
  db.query(query, [managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/leads/google/:managerid', (req, res) => {
  const { managerid } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE primarySource = 'Google' AND managerid = ?
  `;
  
  db.query(query, [managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/leads/others/:managerid', (req, res) => {
  const { managerid } = req.params;
  const query = `
    SELECT COUNT(*) AS count 
FROM addleads 
WHERE managerid = ? 
  AND (primarySource NOT IN ('Google', 'Referral') OR primarySource IS NULL)
  AND (sources NOT IN ('fb', 'Facebook') OR sources IS NULL)
  AND (channel IS NULL OR channel != 'Website');

  `;

  db.query(query, [managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/leads/weekly/:managerid', (req, res) => {
  const { managerid } = req.params;

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
    WHERE DATE(created_at) BETWEEN ? AND ? AND managerid = ?
  `;

  db.query(query, [startDate, endDate, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      managerid,
      count: results[0].count
    });
  });
});

router.get('/leads/monthly/:managerid', (req, res) => {
  const { managerid } = req.params;

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 01, 02, ..., 12

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE DATE_FORMAT(created_at, '%Y-%m') = ? AND managerid = ?
  `;

  db.query(query, [`${year}-${month}`, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: `${year}-${month}`,
      managerid,
      count: results[0].count
    });
  });
});

router.get('/leads/confirmed/weekly/:managerid', (req, res) => {
  const { managerid } = req.params;

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
    AND a.managerid = ?
`;


  db.query(query, [startDate, endDate, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      managerid,
      count: results[0].count
    });
  });
});
router.get('/leads/confirmed/monthly/:managerid', (req, res) => {
  const { managerid } = req.params;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Ensure two digits

  const query = `
  SELECT COUNT(*) AS count 
  FROM addleads a
  JOIN travel_opportunity t ON a.leadid = t.leadid
  WHERE a.status = 'opportunity' 
    AND DATE_FORMAT(t.created_at, '%Y-%m') = ? 
    AND a.managerid = ?
`;


  db.query(query, [`${year}-${month}`, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: `${year}-${month}`,
      managerid,
      count: results[0].count
    });
  });
});

router.get('/opps/confirmed/today/:managerid', (req, res) => {
  const { managerid } = req.params;
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE opportunity_status1 = 'Confirmed' 
    AND DATE(status_updated_at) = ? AND managerid = ?
  `;

  db.query(query, [today, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ managerid, count: results[0].count });
  });
});
router.get('/opps/confirmed/weekly/:managerid', (req, res) => {
  const { managerid } = req.params;
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
    AND DATE(status_updated_at) BETWEEN ? AND ? AND managerid = ?
  `;

  db.query(query, [startDate, endDate, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      managerid,
      count: results[0].count,
    });
  });
});
router.get('/opps/confirmed/monthly/:managerid', (req, res) => {
  const { managerid } = req.params;
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE opportunity_status1 = 'Confirmed' 
    AND DATE_FORMAT(status_updated_at, '%Y-%m') = ? AND managerid = ?
  `;

  db.query(query, [`${year}-${month}`, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: `${year}-${month}`,
      managerid,
      count: results[0].count,
    });
  });
});
router.get('/receivables/today/:userid', (req, res) => {
  const { userid } = req.params;
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT SUM(CAST(paid_amount AS DECIMAL(10,2))) AS total_paid 
    FROM receivables 
    WHERE status = 'approved' 
    AND DATE(status_updated_at) = ? AND userid = ?
  `;

  db.query(query, [today, userid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ date: today, total_paid: results[0].total_paid || 0 });
  });
});


router.get('/receivables/weekly/:userid', (req, res) => {
  const { userid } = req.params;
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const startDate = sunday.toISOString().split('T')[0];
  const endDate = saturday.toISOString().split('T')[0];

  const query = `
    SELECT SUM(CAST(paid_amount AS DECIMAL(10,2))) AS total_paid 
    FROM receivables 
    WHERE status = 'approved' 
    AND DATE(status_updated_at) BETWEEN ? AND ? AND userid = ?
  `;

  db.query(query, [startDate, endDate, userid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      total_paid: results[0].total_paid || 0
    });
  });
});

router.get('/receivables/monthly/:userid', (req, res) => {
  const { userid } = req.params;
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const query = `
    SELECT SUM(CAST(paid_amount AS DECIMAL(10,2))) AS total_paid 
    FROM receivables 
    WHERE status = 'approved' 
    AND DATE_FORMAT(status_updated_at, '%Y-%m') = ? AND userid = ?
  `;

  db.query(query, [`${year}-${month}`, userid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: `${year}-${month}`,
      total_paid: results[0].total_paid || 0
    });
  });
});
router.get('/payables/today/:userid', (req, res) => {
  const { userid } = req.params;
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT SUM(paid_amount) AS total_paid 
    FROM payment_log 
    WHERE status = 'Approved' 
    AND DATE(status_updated_at) = ? 
    AND userid = ?
  `;

  db.query(query, [today, userid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ date: today, total_paid: results[0].total_paid || 0 });
  });
});
router.get('/payables/weekly/:userid', (req, res) => {
  const { userid } = req.params;
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const startDate = sunday.toISOString().split('T')[0];
  const endDate = saturday.toISOString().split('T')[0];

  const query = `
    SELECT SUM(paid_amount) AS total_paid 
    FROM payment_log 
    WHERE status = 'Approved' 
    AND DATE(status_updated_at) BETWEEN ? AND ? 
    AND userid = ?
  `;

  db.query(query, [startDate, endDate, userid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      total_paid: results[0].total_paid || 0
    });
  });
});
router.get('/payables/monthly/:userid', (req, res) => {
  const { userid } = req.params;
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const query = `
    SELECT SUM(paid_amount) AS total_paid 
    FROM payment_log 
    WHERE status = 'Approved' 
    AND DATE_FORMAT(status_updated_at, '%Y-%m') = ? 
    AND userid = ?
  `;

  db.query(query, [`${year}-${month}`, userid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: `${year}-${month}`,
      total_paid: results[0].total_paid || 0
    });
  });
});
router.get('/hots/today/:managerid', (req, res) => {
  const { managerid } = req.params;
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT COUNT(*) AS count
    FROM addleads a
    WHERE a.leadid IN (
      SELECT t.leadid
      FROM travel_opportunity t
      WHERE t.tag = 'Hot' AND DATE(t.tagged_date) = ?
    )
    AND a.managerid = ?
  `;

  db.query(query, [today, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ date: today, managerid, count: results[0].count });
  });
});
router.get('/hots/weekly/:managerid', (req, res) => {
  const { managerid } = req.params;
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
    FROM addleads a
    WHERE a.leadid IN (
      SELECT t.leadid
      FROM travel_opportunity t
      WHERE t.tag = 'Hot' 
      AND DATE(t.tagged_date) BETWEEN ? AND ?
    )
    AND a.managerid = ?
  `;

  db.query(query, [startDate, endDate, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ week_start: startDate, week_end: endDate, managerid, count: results[0].count });
  });
});
router.get('/hots/monthly/:managerid', (req, res) => {
  const { managerid } = req.params;
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
    AND a.managerid = ?
  `;

  db.query(query, [`${year}-${month}`, managerid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ month: `${year}-${month}`, managerid, count: results[0].count });
  });
});


module.exports = router;