const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());           // Allow React to connect to Express
app.use(express.json());   // Parse JSON bodies

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',        // Your MySQL username
  password: '@Underdog123',        // Your MySQL password
  database: 'udog',  // Your database name
});

// Create time_slots table if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    walker_id INT,
    status ENUM('available', 'booked', 'completed') DEFAULT 'available',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (walker_id) REFERENCES walkers(id)
  )
`, (err) => {
  if (err) {
    console.error('Error creating time_slots table:', err);
  } else {
    console.log('Time slots table ready');
  }
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

// --- CRUD API for Dogs ---

// 1. Get all dogs
app.get('/dogs', (req, res) => {
  const query = 'SELECT * FROM dogs';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// 2. Add a new dog
app.post('/dogs', (req, res) => {
  const { name, breed, description, imageUrl } = req.body;
  const query = 'INSERT INTO dogs (name, breed, description, imageUrl) VALUES (?, ?, ?, ?)';
  db.query(query, [name, breed, description, imageUrl], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).json({ id: result.insertId, name, breed, description, imageUrl });
    }
  });
});

// 3. Update dog info
app.put('/dogs/:id', (req, res) => {
  const { id } = req.params;
  const { name, breed, description, imageUrl } = req.body;
  const query = 'UPDATE dogs SET name = ?, breed = ?, description = ?, imageUrl = ? WHERE id = ?';
  db.query(query, [name, breed, description, imageUrl, id], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: 'Dog updated successfully' });
    }
  });
});

// 4. Delete a dog
app.delete('/dogs/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM dogs WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: 'Dog deleted successfully' });
    }
  });
});

// --- Time Slots API ---

// 1. Get all time slots
app.get('/time-slots', (req, res) => {
  const query = `
    SELECT ts.*, w.name as walker_name 
    FROM time_slots ts 
    LEFT JOIN walkers w ON ts.walker_id = w.id
    ORDER BY ts.start_time ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// 2. Create new time slot (for marshals)
app.post('/time-slots', (req, res) => {
  const { start_time, end_time, created_by } = req.body;
  const query = 'INSERT INTO time_slots (start_time, end_time, created_by) VALUES (?, ?, ?)';
  db.query(query, [start_time, end_time, created_by], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).json({ 
        id: result.insertId, 
        start_time, 
        end_time, 
        created_by,
        status: 'available' 
      });
    }
  });
});

// 3. Book a time slot (for walkers)
app.put('/time-slots/:id/book', (req, res) => {
  const { id } = req.params;
  const { walker_id } = req.body;
  const query = 'UPDATE time_slots SET walker_id = ?, status = "booked" WHERE id = ? AND status = "available"';
  db.query(query, [walker_id, id], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else if (result.affectedRows === 0) {
      res.status(400).json({ message: 'Time slot not available' });
    } else {
      res.json({ message: 'Time slot booked successfully' });
    }
  });
});

// 4. Cancel a booking
app.put('/time-slots/:id/cancel', (req, res) => {
  const { id } = req.params;
  const query = 'UPDATE time_slots SET walker_id = NULL, status = "available" WHERE id = ? AND status = "booked"';
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: 'Booking cancelled successfully' });
    }
  });
});

// 5. Get time slots by walker
app.get('/time-slots/walker/:walkerId', (req, res) => {
  const { walkerId } = req.params;
  const query = 'SELECT * FROM time_slots WHERE walker_id = ? ORDER BY start_time ASC';
  db.query(query, [walkerId], (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});