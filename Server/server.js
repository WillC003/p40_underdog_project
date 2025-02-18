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

// ✅ --- GET All Time Slots ---
app.get('/time-slots', (req, res) => {
  const query = `
    SELECT ts.id, ts.start_time, ts.end_time, ts.status, 
      COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT('walker_id', eb.walker_id, 'walker_name', eb.walker_name)
        ), '[]'
      ) AS booked_walkers
    FROM time_slots ts
    LEFT JOIN event_bookings eb ON ts.id = eb.time_slot_id
    GROUP BY ts.id
    ORDER BY ts.start_time ASC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });

    // Ensure `booked_walkers` is parsed correctly
    const formattedResults = results.map(slot => ({
      ...slot,
      booked_walkers: JSON.parse(slot.booked_walkers || '[]')
    }));

    res.json(formattedResults);
  });
});

// ✅ --- CREATE Time Slot (Marshal Only) ---
app.post('/time-slots', (req, res) => {
  let { start_time, end_time, created_by } = req.body;

  if (created_by !== 'marshal') {
    return res.status(403).json({ message: "Only Marshals can create time slots" });
  }

  // Convert ISO 8601 to MySQL DATETIME format
  const formattedStartTime = new Date(start_time).toISOString().slice(0, 19).replace('T', ' ');
  const formattedEndTime = new Date(end_time).toISOString().slice(0, 19).replace('T', ' ');

  const query = `INSERT INTO time_slots (start_time, end_time, created_by, status) VALUES (?, ?, ?, 'available')`;

  db.query(query, [formattedStartTime, formattedEndTime, created_by], (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).send(err);
    }
    res.status(201).json({ id: result.insertId, message: "Time slot created successfully!" });
  });
});

// ✅ --- BOOK a Time Slot (Walker Only) ---
app.put('/time-slots/:id/book', (req, res) => {
  const { id } = req.params;
  const { walker_id, walker_name } = req.body;

  if (!walker_id || !walker_name) {
    return res.status(400).json({ message: "Walker ID and Name are required to book a time slot." });
  }

  // Check if the walker already booked this slot
  db.query('SELECT * FROM event_bookings WHERE time_slot_id = ? AND walker_id = ?', 
    [id, walker_id], (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err });

      if (results.length > 0) {
        return res.status(400).json({ message: "You have already booked this time slot." });
      }

      // Insert booking into `event_bookings` table
      const query = `INSERT INTO event_bookings (time_slot_id, walker_id, walker_name) VALUES (?, ?, ?)`;
      db.query(query, [id, walker_id, walker_name], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });

        res.json({ message: "Time slot booked successfully!" });
      });
  });
});

// ✅ --- DELETE Time Slot (Marshal Only) ---
app.delete('/time-slots/:id/delete', (req, res) => {
  const { id } = req.params;

  // Delete event and its bookings
  db.query('DELETE FROM time_slots WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Time slot not found or already deleted." });
    }

    res.json({ message: "Time slot deleted successfully!" });
  });
});

// ✅ --- CANCEL a Booking (Walker Only) ---
app.put('/time-slots/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { walker_id } = req.body;

  if (!walker_id) {
    return res.status(400).json({ message: "Walker ID is required to cancel booking." });
  }

  const query = `DELETE FROM event_bookings WHERE time_slot_id = ? AND walker_id = ?`;

  db.query(query, [id, walker_id], (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).send(err);
    }
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Booking not found or already canceled." });
    }
    res.json({ message: "Booking canceled successfully!" });
  });
});

// ✅ LOGIN API
app.post('/login', async (req, res) => {
  try {
    console.log("Login Request:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    db.query('SELECT * FROM walkers WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error("Database Error (Login):", err);
        return res.status(500).send({ message: "Database error occurred." });
      }
      if (results.length === 0) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const walker = results[0];
      const isMatch = await bcrypt.compare(password, walker.password);

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

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

// ✅ SIGNUP API
app.post('/signup', async (req, res) => {
  try {
    const { name, phoneNumber, email, password, role } = req.body;

    if (!name || !phoneNumber || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO walkers (name, phoneNumber, email, password, role) VALUES (?, ?, ?, ?, ?)';

    db.query(query, [name, phoneNumber, email, hashedPassword, role || 'Walker'], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Email already exists' });
        }
        return res.status(500).json({ message: "Database error occurred." });
      }
      res.status(201).json({ message: "Walker registered successfully!" });
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed." });
  }
});