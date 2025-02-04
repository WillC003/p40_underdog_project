const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());           // Allow React to connect to Express
app.use(express.json());   // Parse JSON bodies

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',        // Your MySQL username
  password: 'Sam&gracie17',        // Your MySQL password
  database: 'p40_practice',  // Your database name
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});


// --- CRUD API for Walkers ---

// 1. Get all walkers
app.get('/walkers', (req, res) => {
  const query = 'SELECT * FROM walkers';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// 2. Add a new walker
app.post('/walkers', (req, res) => {
  const { name, phoneNumber } = req.body;
  const query = 'INSERT INTO walkers (name, phoneNumber) VALUES (?, ?)';
  db.query(query, [name, phoneNumber], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).json({ id: result.insertId, name, phoneNumber });
    }
  });
});

// 3. Update walker info
app.put('/walkers/:id', (req, res) => {
  const { id } = req.params;
  const { name, phoneNumber } = req.body;
  const query = 'UPDATE walkers SET name = ?, phoneNumber = ? WHERE id = ?';
  db.query(query, [name, phoneNumber, id], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: 'Walker updated successfully' });
    }
  });
});

// 4. Delete a walker
app.delete('/walkers/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM walkers WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: 'Walker deleted successfully' });
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
