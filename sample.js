const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
  database: 'beautydb',
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySQL database.');
});



// GET all services
app.get('/api/services', (req, res) => {
  db.query('SELECT * FROM services', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST new service
app.post('/api/services', (req, res) => {
  const { service_name } = req.body;
  if (!service_name) return res.status(400).json({ error: 'Service name is required.' });

  db.query('INSERT INTO services (service_name) VALUES (?)', [service_name], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, service_name });
  });
});

// PUT (Update) service by id
app.put('/api/services/:id', (req, res) => {
  const { id } = req.params;
  const { service_name } = req.body;

  db.query('UPDATE services SET service_name = ? WHERE id = ?', [service_name, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Service updated successfully.' });
  });
});

// DELETE service by id
app.delete('/api/services/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM services WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Service deleted successfully.' });
  });
});





//post api for registration of customter
app.post('/api/register', (req, res) => {
  const { fullName, phoneNumber, email, address, service, location, serviceDate, estimatedCost } = req.body;

  // SQL query to insert data into the table
  const query = `INSERT INTO registrations (fullName, phoneNumber, email, address, service, location, serviceDate, estimatedCost)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [fullName, phoneNumber, email, address, service, location, serviceDate, estimatedCost], (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Failed to register' });
    }
    return res.status(200).json({ message: 'Registration successful', id: result.insertId });
  });
});

app.get('/api/registrations', (req, res) => {
  const query = `
    SELECT 
      id,
      fullName AS name,
      phoneNumber AS PhoneNumber,
      email,
      address,
      service AS Service,
      location AS Location,
      serviceDate AS Date,
      estimatedCost AS Amount
    FROM registrations
    ORDER BY serviceDate DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});


app.get('/customer/:id', (req, res) => {
  const registrationId = req.params.id;
  const query = 'SELECT * FROM registrations WHERE id = ?';

  db.query(query, [registrationId], (err, results) => {
    if (err) {
      console.error('Error fetching registration by ID:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json(results[0]);
  });
});


app.delete('/deletecustomer/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM registrations WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Delete Error:', err);
      return res.status(500).json({ error: 'Database delete error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

// Update customer by ID
// Update customer by ID
app.put('/updatecustomer/:id', (req, res) => {
    const registrationId = req.params.id;
    const {
      fullName,
      phoneNumber,
      email,
      address,
      service,
      location,
      serviceDate,
      estimatedCost
    } = req.body;
  
    const query = `
      UPDATE registrations 
      SET 
        fullName = ?,
        phoneNumber = ?,
        email = ?,
        address = ?,
        service = ?,
        location = ?,
        serviceDate = ?,
        estimatedCost = ?
      WHERE id = ?
    `;
  
    db.query(
      query,
      [
        fullName,
        phoneNumber,
        email,
        address,
        service,
        location,
        serviceDate,
        estimatedCost,
        registrationId
      ],
      (err, results) => {
        if (err) {
          console.error('Error updating registration:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
  
        if (results.affectedRows === 0) {
          return res.status(404).json({ message: 'Registration not found' });
        }
  
        res.json({ message: 'Registration updated successfully' });
      }
    );
  });

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
