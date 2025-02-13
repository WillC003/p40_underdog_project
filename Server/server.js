const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');

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

// --- CRUD API for Walk Events ---

app.get('/walk-events', (req, res) => {
  const { date } = req.query;
  let query = `
      SELECT e.*, COALESCE(COUNT(b.id), 0) AS bookedWalkers 
      FROM walk_events e 
      LEFT JOIN event_bookings b ON e.id = b.eventId 
  `;
  let params = [];

  if (date) {
    query += " WHERE e.eventDate = ? ";
    params.push(date);
  }

  query += " GROUP BY e.id ORDER BY e.eventDate ASC";

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});


// Get bookings for a specific event
app.get('/event-bookings/:eventId', (req, res) => {
  const { eventId } = req.params;
  const query = 'SELECT * FROM event_bookings WHERE eventId = ?';
  db.query(query, [eventId], (err, results) => {
      if (err) res.status(500).send(err);
      else res.json(results);
  });
});

// Book a walker for an event (Max 4 Walkers)
app.post('/event-bookings', (req, res) => {
  const { eventId, walkerName, walkerPhone } = req.body;

  // Check if event already has 4 bookings
  db.query('SELECT COUNT(*) AS count FROM event_bookings WHERE eventId = ?', [eventId], (err, result) => {
      if (err) return res.status(500).send(err);

      if (result[0].count >= 4) {
          return res.status(400).json({ message: 'This event is already full.' });
      }

      // Add booking
      const query = 'INSERT INTO event_bookings (eventId, walkerName, walkerPhone) VALUES (?, ?, ?)';
      db.query(query, [eventId, walkerName, walkerPhone], (err, result) => {
          if (err) res.status(500).send(err);
          else res.status(201).json({ id: result.insertId, eventId, walkerName, walkerPhone });
      });
  });
});

// Delete a booking
app.delete('/event-bookings/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM event_bookings WHERE id = ?';
  db.query(query, [id], (err, result) => {
      if (err) res.status(500).send(err);
      else res.json({ message: 'Booking deleted successfully' });
  });
});


//signup
app.post('/signup', async (req, res) => {
  try {
    console.log("Signup Request:", req.body);
    const { name, phoneNumber, email, password, role } = req.body;

    // Hash password before storing in database
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO walkers (name, phoneNumber, email, password, role) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, phoneNumber, email, hashedPassword, role || 'Walker'], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Email already exists' });
        }
        console.error("Database Error (Signup):", err);
        return res.status(500).send(err);
      }
      res.status(201).json({ message: "Walker registered successfully!" });
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Signup failed." });
  }
});

//login
app.post('/login', async (req, res) => {
  try {
    console.log("Login Request:", req.body);
    const { email, password } = req.body;

    db.query('SELECT * FROM walkers WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error("Database Error (Login):", err);
        return res.status(500).send(err);
      }
      if (results.length === 0) {
        console.log("Login Failed: Invalid email.");
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const walker = results[0];
      const isMatch = await bcrypt.compare(password, walker.password);
      
      if (!isMatch) {
        console.log("Login Failed: Wrong password.");
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // ✅ Success! Return walker data with role
      res.json({ 
        message: "Login successful!", 
        walker: { id: walker.id, name: walker.name, email: walker.email, role: walker.role } 
      });
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed." });
  }
});
