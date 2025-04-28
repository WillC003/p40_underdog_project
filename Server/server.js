const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 8000;


// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.example.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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
  host: 'localhost',
  user: 'root',
  password: 'Sam&gracie17',
  database: 'udog',
  port: 3306,
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
    return;
  }
  
  if (connection) {
    console.log('Successfully connected to the database.');
    connection.release();
  }
});

// Convert pool query to promise
const query = (sql, values) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (error, results) => {
      if (error) {
        console.error('Query error:', error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based authorization middleware
const authorizeRoles = (roles) => {
  return async (req, res, next) => {
    try {
      const userRecord = await admin.auth().getUser(req.user.uid);
      const userSnapshot = await admin.firestore().collection('users').doc(req.user.uid).get();
      const userData = userSnapshot.data();
      
      if (roles.includes(userData.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error checking user role' });
    }
  };
};

// API Routes

// Dogs routes
app.get('/dogs', authenticateUser, async (req, res) => {
  try {
    const results = await query('SELECT * FROM dogs');
    res.json(results);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

app.post('/dogs', authenticateUser, authorizeRoles(['admin', 'marshal']), async (req, res) => {
  const { name, breed, description, imageUrl, grade } = req.body;
  try {
    console.log('Creating dog with data:', { name, breed, description, imageUrl, created_by: req.user.uid });

    if (!name) {
      return res.status(400).json({ error: 'Dog name is required' });
    }

    const result = await query(
      'INSERT INTO dogs (name, breed, description, imageUrl, grade, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name, breed, description, imageUrl, grade || 'grey', req.user.uid]
    );

    const newDog = {
      id: result.insertId,
      name,
      breed,
      description,
      imageUrl,
      created_by: req.user.uid
    };

    console.log('Dog created successfully:', newDog);
    res.status(201).json(newDog);
  } catch (error) {
    console.error('Error creating dog:', error);
    res.status(500).json({ 
      error: 'Failed to create dog',
      details: error.message,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  }
});

app.delete('/dogs/:id', authenticateUser, authorizeRoles(['admin', 'marshal']), async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM dogs WHERE id = ?', [id]);
    res.json({ message: 'Dog deleted' });
  } catch (err) {
    console.error('Failed to delete dog:', err);
    res.status(500).json({ error: 'Failed to delete dog' });
  }
});

app.put('/dogs/:id', authenticateUser, authorizeRoles(['admin', 'marshal']), async (req, res) => {
  const { id } = req.params;
  const { name, breed, description, imageUrl, grade } = req.body;

  try {
    await query(
      `UPDATE dogs SET name = ?, breed = ?, description = ?, imageUrl = ?, grade = ? WHERE id = ?`,
      [name, breed, description, imageUrl, grade, id]

    );
    res.json({ message: 'Dog updated successfully' });
  } catch (err) {
    console.error('Error updating dog:', err);
    res.status(500).json({ error: 'Failed to update dog' });
  }
});
// Walkers routes
app.get('/walkers', authenticateUser, async (req, res) => {
  try {
    // Query Firestore to get all users with role 'walker'
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('role', '==', 'walker').get();
    
    const walkers = [];
    snapshot.forEach(doc => {
      walkers.push({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        phoneNumber: doc.data().phoneNumber
      });
    });
    
    res.json(walkers);
  } catch (error) {
    console.error('Error fetching walkers:', error);
    res.status(500).json({ error: 'Failed to fetch walkers' });
  }
});

// Time slots routes
app.get('/time-slots', authenticateUser, async (req, res) => {
  try {
    const slots = await query('SELECT * FROM time_slots ORDER BY start_time ASC');
    res.json(slots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
});

app.post('/time-slots', authenticateUser, authorizeRoles(['marshal']), async (req, res) => {
  const { start_time, end_time } = req.body;

  console.log('Received time slot:', {
    start_time,
    end_time,
    user: req.user || 'No user found'
  });

  try {
    if (!start_time || !end_time || !req.user?.uid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(
      'INSERT INTO time_slots (start_time, end_time, status, created_by) VALUES (?, ?, "available", ?)',
      [start_time, end_time, req.user.uid]
    );

    res.status(201).json({
      id: result.insertId,
      start_time,
      end_time,
      status: 'available',
      created_by: req.user.uid
    });
  } catch (error) {
    console.error('Error creating time slot:', error);
    res.status(500).json({
      error: 'Failed to create time slot',
      details: error.message,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  }
});

app.put('/time-slots/:id/book', authenticateUser, authorizeRoles(['walker']), async (req, res) => {
  const { id } = req.params;
  const walkerId = req.user.uid;

  try {
    // Check if time slot exists and is available or booked
    const slot = await query('SELECT * FROM time_slots WHERE id = ?', [id]);
    if (!slot.length) return res.status(404).json({ error: 'Time slot not found' });

    // Check how many walkers already booked
    const existing = await query('SELECT COUNT(*) AS count FROM time_slot_bookings WHERE time_slot_id = ?', [id]);
    if (existing[0].count >= 4) return res.status(400).json({ error: 'Time slot is fully booked' });

    // Prevent duplicate booking
    const alreadyBooked = await query(
      'SELECT * FROM time_slot_bookings WHERE time_slot_id = ? AND walker_id = ?',
      [id, walkerId]
    );
    if (alreadyBooked.length > 0) return res.status(400).json({ error: 'You already booked this slot' });

    // Add booking
    await query('INSERT INTO time_slot_bookings (time_slot_id, walker_id) VALUES (?, ?)', [id, walkerId]);

    // Update time slot status to booked (if it was available)
    if (slot[0].status === 'available') {
      await query('UPDATE time_slots SET status = "booked" WHERE id = ?', [id]);
    }

    res.json({ message: 'Booking successful' });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to book time slot' });
  }
});

app.get('/time-slots/:id/bookings', authenticateUser, authorizeRoles(['marshal']), async (req, res) => {
  const { id } = req.params;

  try {
    const bookings = await query('SELECT walker_id FROM time_slot_bookings WHERE time_slot_id = ?', [id]);

    const usersRef = admin.firestore().collection('users');
    const walkers = await Promise.all(bookings.map(async (b) => {
      const doc = await usersRef.doc(b.walker_id).get();
      return doc.exists ? { id: b.walker_id, ...doc.data() } : null;
    }));

    res.json(walkers.filter(w => w !== null));
  } catch (error) {
    console.error('Failed to fetch slot bookings:', error);
    res.status(500).json({ error: 'Could not load bookings' });
  }
});

app.delete('/time-slots/:id', authenticateUser, authorizeRoles(['marshal']), async (req, res) => {
  const { id } = req.params;

  try {
    await query('DELETE FROM time_slots WHERE id = ?', [id]);
    res.json({ message: 'Time slot deleted' });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    res.status(500).json({ error: 'Failed to delete time slot' });
  }
});

// Walks routes
app.get('/walks', authenticateUser, async (req, res) => {
  try {
    const { type, range } = req.query;
    let sqlQuery = `
       SELECT 
    w.*,
    d.name as dog_name,
    d.breed as dog_breed,
    ts.start_time,
    ts.end_time,
    ts.created_by as marshal_id
  FROM walks w
      JOIN dogs d ON w.dog_id = d.id
      JOIN time_slots ts ON w.time_slot_id = ts.id
      WHERE 1=1
    `;

    // Add filters based on type and range
    const now = new Date().toISOString();
    if (type === 'upcoming') {
      sqlQuery += ` AND ts.start_time > '${now}' AND w.status = 'scheduled'`;
    } else if (type === 'completed') {
      if (range === 'day') {
        sqlQuery += ` AND DATE(ts.start_time) = CURDATE() AND w.status = 'completed'`;
      } else if (range === 'week') {
        sqlQuery += ` AND ts.start_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND w.status = 'completed'`;
      } else {
        sqlQuery += ` AND w.status = 'completed'`;
      }
    }

    sqlQuery += ' ORDER BY ts.start_time DESC';

    console.log('Executing walks query:', sqlQuery);
    const walks = await query(sqlQuery);
    
    // Get all unique user IDs from the walks
    const userIds = new Set();
    walks.forEach(walk => {
      if (walk.walker_id) userIds.add(walk.walker_id);
      if (walk.marshal_id) userIds.add(walk.marshal_id);
    });

    // Fetch user details from Firestore
    const userDetails = {};
    const usersRef = admin.firestore().collection('users');
    await Promise.all([...userIds].map(async (userId) => {
      const userDoc = await usersRef.doc(userId).get();
      if (userDoc.exists) {
        userDetails[userId] = userDoc.data();
      }
    }));

    // Map the walks to include formatted dates and user names
    const formattedWalks = walks.map(walk => ({
      ...walk,
      start_time: new Date(walk.start_time).toISOString(),
      end_time: new Date(walk.end_time).toISOString(),
      walker_name: walk.walker_id ? (userDetails[walk.walker_id]?.name || 'Unknown Walker') : null,
      marshal_name: walk.marshal_id ? (userDetails[walk.marshal_id]?.name || 'Unknown Marshal') : null
    }));

    res.json(formattedWalks);
  } catch (error) {
    console.error('Error fetching walks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch walks',
      details: error.message,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  }
});

app.post('/walks', authenticateUser, authorizeRoles(['marshal']), async (req, res) => {
  const { timeSlotId, walkerIds, dogIds, notes } = req.body;

  if (!timeSlotId || !walkerIds?.length || !dogIds?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await query('START TRANSACTION');

    for (const dogId of dogIds) {
      const walkResult = await query(
        'INSERT INTO walks (dog_id, time_slot_id, notes, status) VALUES (?, ?, ?, "completed")',
        [dogId, timeSlotId, notes || '']
      );
    }

    await query(
      'UPDATE time_slots SET status = "completed" WHERE id = ?',
      [timeSlotId]
    );

    await query('COMMIT');
    res.status(201).json({ message: 'Walk finalized' });
  } catch (err) {
    await query('ROLLBACK');
    console.error('Walk finalize error:', err);
    res.status(500).json({ error: 'Failed to finalize walk' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Test database connection endpoint
app.get('/test-db', async (req, res) => {
  try {
    const connection = await pool.promise().getConnection();
    const [rows] = await connection.query('SELECT 1 as value');
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

app.post('/time-slots/:id/assign-dogs', authenticateUser, authorizeRoles(['admin']), async (req, res) => {
  const { dogIds } = req.body;
  const { id } = req.params;

  if (!dogIds || !Array.isArray(dogIds)) {
    return res.status(400).json({ error: 'dogIds array is required' });
  }

  try {
    await query('DELETE FROM time_slot_dogs WHERE time_slot_id = ?', [id]);

    for (const dogId of dogIds) {
      await query('INSERT INTO time_slot_dogs (time_slot_id, dog_id) VALUES (?, ?)', [id, dogId]);
    }

    res.json({ message: 'Dogs assigned to time slot' });
  } catch (err) {
    console.error('Failed to assign dogs:', err);
    res.status(500).json({ error: 'Failed to assign dogs' });
  }
});

app.get('/time-slots/:id/assigned-dogs', authenticateUser, authorizeRoles(['marshal']), async (req, res) => {
  const { id } = req.params;

  try {
    const dogs = await query(
      `SELECT d.id, d.name, d.breed, d.description
       FROM time_slot_dogs tsd
       JOIN dogs d ON tsd.dog_id = d.id
       WHERE tsd.time_slot_id = ?`,
      [id]
    );

    res.json(dogs);
  } catch (err) {
    console.error('Failed to fetch assigned dogs:', err);
    res.status(500).json({ error: 'Could not load dogs for this slot' });
  }
});

app.get('/upcoming-walks', authenticateUser, authorizeRoles(['admin']), async (req, res) => {
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Pull all future time slots
    const slots = await query(`
      SELECT id, start_time, end_time, status, created_by
      FROM time_slots
      WHERE start_time > ?
      ORDER BY start_time ASC
    `, [now]);

    // Fetch marshal names from Firestore
    const usersRef = admin.firestore().collection('users');
    const slotsWithNames = await Promise.all(
      slots.map(async (slot) => {
        try {
          const userDoc = await usersRef.doc(slot.created_by).get();
          const marshal_name = userDoc.exists ? userDoc.data().name : 'Unknown Marshal';
          return { ...slot, marshal_name };
        } catch {
          return { ...slot, marshal_name: 'Unknown Marshal' };
        }
      })
    );

    res.json(slotsWithNames);
  } catch (error) {
    console.error('Error fetching upcoming time slots:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming walks' });
  }
});

app.get('/dog-walk-stats', authenticateUser, authorizeRoles(['admin']), async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        d.id,
        d.name,
        d.breed,
        MAX(ts.start_time) AS last_walked,
        SUM(CASE WHEN ts.start_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS walks_this_week,
        SUM(CASE WHEN ts.start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS walks_this_month
      FROM dogs d
      LEFT JOIN walks w ON d.id = w.dog_id
      LEFT JOIN time_slots ts ON w.time_slot_id = ts.id
      WHERE w.status = 'completed'
      GROUP BY d.id, d.name, d.breed
      ORDER BY d.name ASC;
    `);
    res.json(stats);
  } catch (err) {
    console.error('Error fetching dog walk stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.post('/block-day', authenticateUser, authorizeRoles(['admin']), async (req, res) => {
  const { date } = req.body; // e.g., "2025-05-10"

  const startTime = `${date} 00:00:00`;
  const endTime = `${date} 23:59:59`;

  try {
    await query(
      `INSERT INTO time_slots (start_time, end_time, status, type, created_by) VALUES (?, ?, 'blocked', 'blocked', ?)`,
      [startTime, endTime, req.user.uid]
    );
    res.status(201).json({ message: 'Day blocked successfully' });
  } catch (error) {
    console.error('Error blocking day:', error);
    res.status(500).json({ error: 'Failed to block day' });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});