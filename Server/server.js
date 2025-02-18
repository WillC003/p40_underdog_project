const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000').split(',');
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// MySQL Connection Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'ec2-18-217-112-78.us-east-2.compute.amazonaws.com', // Replace with your EC2 public DNS
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '@new-password',
  database: process.env.DB_NAME || 'udog',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    }
    return;
  }
  
  if (connection) {
    console.log('Successfully connected to the database.');
    connection.release();
  }
});

// Create time_slots table if it doesn't exist
pool.query(`
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

// Convert pool query to promise
const query = (sql, values) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// API Routes
app.get('/walkers', async (req, res) => {
  try {
    const results = await query('SELECT * FROM walkers');
    res.json(results);
  } catch (error) {
    console.error('Error fetching walkers:', error);
    res.status(500).json({ error: 'Failed to fetch walkers' });
  }
});

app.post('/walkers', async (req, res) => {
  const { name, phoneNumber } = req.body;
  try {
    const result = await query('INSERT INTO walkers (name, phoneNumber) VALUES (?, ?)', [name, phoneNumber]);
    res.status(201).json({ id: result.insertId, name, phoneNumber });
  } catch (error) {
    console.error('Error creating walker:', error);
    res.status(500).json({ error: 'Failed to create walker' });
  }
});

app.put('/walkers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phoneNumber } = req.body;
  try {
    await query('UPDATE walkers SET name = ?, phoneNumber = ? WHERE id = ?', [name, phoneNumber, id]);
    res.json({ message: 'Walker updated successfully' });
  } catch (error) {
    console.error('Error updating walker:', error);
    res.status(500).json({ error: 'Failed to update walker' });
  }
});

app.delete('/walkers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM walkers WHERE id = ?', [id]);
    res.json({ message: 'Walker deleted successfully' });
  } catch (error) {
    console.error('Error deleting walker:', error);
    res.status(500).json({ error: 'Failed to delete walker' });
  }
});

// Time Slots API
app.get('/time-slots', async (req, res) => {
  try {
    const results = await query(`
      SELECT ts.*, w.name as walker_name 
      FROM time_slots ts 
      LEFT JOIN walkers w ON ts.walker_id = w.id
      ORDER BY ts.start_time ASC
    `);
    res.json(results);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
});

app.post('/time-slots', async (req, res) => {
  const { start_time, end_time, created_by } = req.body;
  try {
    const result = await query(
      'INSERT INTO time_slots (start_time, end_time, created_by) VALUES (?, ?, ?)',
      [start_time, end_time, created_by]
    );
    res.status(201).json({
      id: result.insertId,
      start_time,
      end_time,
      created_by,
      status: 'available'
    });
  } catch (error) {
    console.error('Error creating time slot:', error);
    res.status(500).json({ error: 'Failed to create time slot' });
  }
});

app.put('/time-slots/:id/book', async (req, res) => {
  const { id } = req.params;
  const { walker_id } = req.body;
  try {
    const result = await query(
      'UPDATE time_slots SET walker_id = ?, status = "booked" WHERE id = ? AND status = "available"',
      [walker_id, id]
    );
    if (result.affectedRows === 0) {
      res.status(400).json({ message: 'Time slot not available' });
    } else {
      res.json({ message: 'Time slot booked successfully' });
    }
  } catch (error) {
    console.error('Error booking time slot:', error);
    res.status(500).json({ error: 'Failed to book time slot' });
  }
});

app.put('/time-slots/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    await query(
      'UPDATE time_slots SET walker_id = NULL, status = "available" WHERE id = ? AND status = "booked"',
      [id]
    );
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// --- CRUD API for Dogs ---

// 1. Get all dogs
app.get('/dogs', (req, res) => {
  const query = 'SELECT * FROM dogs';
  pool.query(query, (err, results) => {
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
  pool.query(query, [name, breed, description, imageUrl], (err, result) => {
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
  pool.query(query, [name, breed, description, imageUrl, id], (err, result) => {
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
  pool.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: 'Dog deleted successfully' });
    }
  });
});

// 5. Get time slots by walker
app.get('/time-slots/walker/:walkerId', (req, res) => {
  const { walkerId } = req.params;
  const query = 'SELECT * FROM time_slots WHERE walker_id = ? ORDER BY start_time ASC';
  pool.query(query, [walkerId], (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// Test database connection endpoint
app.get('/test-db', async (req, res) => {
  try {
    // Try to get a connection from the pool
    const connection = await pool.promise().getConnection();
    
    // Test a simple query
    const [rows] = await connection.query('SELECT 1 as value');
    
    // Release the connection
    connection.release();
    
    res.json({
      status: 'success',
      message: 'Database connection successful',
      dbHost: dbConfig.host,
      testQuery: rows[0].value
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      dbHost: dbConfig.host
    });
  }
});