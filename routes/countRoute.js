// routes/leadRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Corrected endpoints (remove '/api' from routes)
router.get('/leads/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE DATE(created_at) = ?
  `;
  
  db.query(query, [today], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/leads/confirmed', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const query = `
  SELECT COUNT(*) AS count 
  FROM addleads a
  INNER JOIN travel_opportunity t ON a.leadid = t.leadid
  WHERE a.status = 'opportunity' 
  AND DATE(t.created_at) = ?
`;
  
  db.query(query, [today], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/leads/in-progress', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT COUNT(*) AS count 
      FROM addleads 
      WHERE status = 'lead' 
      AND DATE(created_at) = ?
    `;
    
    db.query(query, [today], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: results[0].count });
    });
  });


// Previous Day Endpoints
router.get('/leads/yesterday', (req, res) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
    
    const query = `
      SELECT COUNT(*) AS count 
      FROM addleads 
      WHERE DATE(created_at) = ?
    `;
    
    db.query(query, [dateString], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: results[0].count });
    });
  });
  
  router.get('/leads/confirmed/yesterday', (req, res) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
  
    const query = `
      SELECT COUNT(*) AS count 
      FROM addleads 
      WHERE status = 'opportunity' 
      AND DATE(created_at) = ?
    `;
    
    db.query(query, [dateString], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: results[0].count });
    });
  });
  
  router.get('/leads/in-progress/yesterday', (req, res) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
  
    const query = `
      SELECT COUNT(*) AS count 
      FROM addleads 
      WHERE status = 'lead' 
      AND DATE(created_at) = ?
    `;
    
    db.query(query, [dateString], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: results[0].count });
    });
  });
  

  router.get('/leads/meta-ads', (req, res) => {
    const query = `
      SELECT COUNT(*) AS count 
      FROM addleads 
      WHERE lead_type = 'Meta Ads'
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ count: results[0].count });
    });
});

// Get count of leads with lead_type not equal to 'Meta Ads'
router.get('/leads/not-meta-ads', (req, res) => {
    const query = `
      SELECT COUNT(*) AS count 
      FROM addleads 
      WHERE lead_type != 'Meta Ads'
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ count: results[0].count });
    });
});

router.get('/leads/facebook', (req, res) => {
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE sources = 'fb'
  `;
  
  db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: results[0].count });
  });
});

router.get('/leads/referral', (req, res) => {
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE primarySource = 'Referral'
  `;
  
  db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: results[0].count });
  });
});

router.get('/leads/campaign', (req, res) => {
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE channel = 'Website'
  `;
  
  db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: results[0].count });
  });
});

router.get('/leads/google', (req, res) => {
  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE primarySource = 'Google'
  `;
  
  db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: results[0].count });
  });
});

router.get('/leads/others', (req, res) => {
  const query = `
    SELECT COUNT(*) AS count 
FROM addleads 
WHERE (primarySource NOT IN ('Google', 'Referral') OR primarySource IS NULL)
  AND (sources NOT IN ('fb', 'Facebook') OR sources IS NULL)
  AND (channel IS NULL OR channel != 'Website');

  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/leads/weekly', (req, res) => {
  const today = new Date();

  // Find the previous Sunday
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);

  // Find the coming Saturday
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const startDate = sunday.toISOString().split('T')[0];
  const endDate = saturday.toISOString().split('T')[0];

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE DATE(created_at) BETWEEN ? AND ?
  `;

  db.query(query, [startDate, endDate], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      count: results[0].count,
    });
  });
});

router.get('/leads/monthly', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // current month

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE DATE_FORMAT(created_at, '%Y-%m') = ?
  `;

  db.query(query, [`${year}-${month}`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/leads/confirmed/weekly', (req, res) => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

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
`;

  db.query(query, [startDate, endDate], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      count: results[0].count,
    });
  });
});
router.get('/leads/confirmed/monthly', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const query = `
  SELECT COUNT(*) AS count 
  FROM addleads a
  JOIN travel_opportunity t ON a.leadid = t.leadid
  WHERE a.status = 'opportunity' 
  AND DATE_FORMAT(t.created_at, '%Y-%m') = ?
`;


  db.query(query, [`${year}-${month}`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: `${year}-${month}`,
      count: results[0].count,
    });
  });
});

router.get('/hots/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT COUNT(*) AS count 
    FROM travel_opportunity 
    WHERE tag = 'Hot' 
    AND DATE(tagged_date) = ?
  `;

  db.query(query, [today], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});
router.get('/hots/weekly', (req, res) => {
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
    FROM travel_opportunity 
    WHERE tag = 'Hot' 
    AND DATE(tagged_date) BETWEEN ? AND ?
  `;

  db.query(query, [startDate, endDate], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      count: results[0].count,
    });
  });
});
router.get('/hots/monthly', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const query = `
    SELECT COUNT(*) AS count 
    FROM travel_opportunity 
    WHERE tag = 'Hot' 
    AND DATE_FORMAT(tagged_date, '%Y-%m') = ?
  `;

  db.query(query, [`${year}-${month}`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: `${year}-${month}`,
      count: results[0].count,
    });
  });
});

router.get('/opps/confirmed/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE opportunity_status1 = 'Confirmed' 
    AND DATE(status_updated_at) = ?
  `;

  db.query(query, [today], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: results[0].count });
  });
});

router.get('/opps/confirmed/weekly', (req, res) => {
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
    AND DATE(status_updated_at) BETWEEN ? AND ?
  `;

  db.query(query, [startDate, endDate], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      count: results[0].count,
    });
  });
});
router.get('/opps/confirmed/monthly', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const query = `
    SELECT COUNT(*) AS count 
    FROM addleads 
    WHERE opportunity_status1 = 'Confirmed' 
    AND DATE_FORMAT(status_updated_at, '%Y-%m') = ?
  `;

  db.query(query, [`${year}-${month}`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: `${year}-${month}`,
      count: results[0].count,
    });
  });
});

router.get('/receivables/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT SUM(CAST(paid_amount AS DECIMAL(10,2))) AS total_paid 
    FROM receivables 
    WHERE status = 'approved' 
    AND DATE(status_updated_at) = ?
  `;

  db.query(query, [today], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ date: today, total_paid: results[0].total_paid || 0 });
  });
});

router.get('/receivables/weekly', (req, res) => {
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
    AND DATE(status_updated_at) BETWEEN ? AND ?
  `;

  db.query(query, [startDate, endDate], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      total_paid: results[0].total_paid || 0
    });
  });
});
router.get('/receivables/monthly', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const query = `
    SELECT SUM(CAST(paid_amount AS DECIMAL(10,2))) AS total_paid 
    FROM receivables 
    WHERE status = 'approved' 
    AND DATE_FORMAT(status_updated_at, '%Y-%m') = ?
  `;

  db.query(query, [`${year}-${month}`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: `${year}-${month}`,
      total_paid: results[0].total_paid || 0
    });
  });
});

router.get('/payables/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT SUM(paid_amount) AS total_paid 
    FROM payment_log 
    WHERE status = 'Approved' 
    AND DATE(status_updated_at) = ?
  `;

  db.query(query, [today], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ date: today, total_paid: results[0].total_paid || 0 });
  });
});

router.get('/payables/weekly', (req, res) => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0
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
  `;

  db.query(query, [startDate, endDate], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      week_start: startDate,
      week_end: endDate,
      total_paid: results[0].total_paid || 0
    });
  });
});

router.get('/payables/monthly', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const query = `
    SELECT SUM(paid_amount) AS total_paid 
    FROM payment_log 
    WHERE status = 'Approved' 
    AND DATE_FORMAT(status_updated_at, '%Y-%m') = ?
  `;

  db.query(query, [`${year}-${month}`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      month: `${year}-${month}`,
      total_paid: results[0].total_paid || 0
    });
  });
});


module.exports = router;