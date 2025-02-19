const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
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
  password: 'laptop123',
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
  const { name, breed, description, imageUrl } = req.body;
  try {
    console.log('Creating dog with data:', { name, breed, description, imageUrl, created_by: req.user.uid });

    if (!name) {
      return res.status(400).json({ error: 'Dog name is required' });
    }

    const result = await query(
      'INSERT INTO dogs (name, breed, description, imageUrl, created_by) VALUES (?, ?, ?, ?, ?)',
      [name, breed, description, imageUrl, req.user.uid]
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
  
  try {
    console.log('Creating time slot with data:', { start_time, end_time, created_by: req.user.uid });

    // Validate the input
    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }

    // Insert the time slot
    const result = await query(
      'INSERT INTO time_slots (start_time, end_time, status, created_by) VALUES (?, ?, "available", ?)',
      [start_time, end_time, req.user.uid]
    );

    const newSlot = {
      id: result.insertId,
      start_time,
      end_time,
      status: 'available',
      created_by: req.user.uid
    };

    console.log('Time slot created successfully:', newSlot);
    res.status(201).json(newSlot);
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
  try {
    console.log('Attempting to book time slot:', { id, walker_id: req.user.uid });
    
    // First check if the slot exists and is available
    const slot = await query('SELECT * FROM time_slots WHERE id = ?', [id]);
    if (!slot.length) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    if (slot[0].status !== 'available') {
      return res.status(400).json({ error: 'Time slot is not available' });
    }

    const result = await query(
      'UPDATE time_slots SET walker_id = ?, status = "booked" WHERE id = ? AND status = "available"',
      [req.user.uid, id]
    );

    if (result.affectedRows === 0) {
      console.error('Failed to book time slot:', { id, walker_id: req.user.uid });
      return res.status(400).json({ error: 'Time slot not available or already booked' });
    }

    console.log('Time slot booked successfully:', { id, walker_id: req.user.uid });
    res.json({ message: 'Time slot booked successfully' });
  } catch (error) {
    console.error('Error booking time slot:', error);
    res.status(500).json({ 
      error: 'Failed to book time slot',
      details: error.message,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
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
        ts.walker_id,
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
  const { dogId, walkerId, timeSlotId, notes } = req.body;
  try {
    console.log('Logging walk with data:', { dogId, walkerId, timeSlotId, notes });

    // Validate required fields
    if (!dogId || !walkerId || !timeSlotId) {
      return res.status(400).json({ error: 'Dog ID, walker ID, and time slot ID are required' });
    }

    // Check if dog exists
    const dog = await query('SELECT * FROM dogs WHERE id = ?', [dogId]);
    if (!dog.length) {
      return res.status(404).json({ error: `Dog with ID ${dogId} not found` });
    }

    // Check if time slot exists and is booked by the correct walker
    const timeSlot = await query('SELECT * FROM time_slots WHERE id = ?', [timeSlotId]);
    if (!timeSlot.length) {
      return res.status(404).json({ error: `Time slot with ID ${timeSlotId} not found` });
    }
    
    if (timeSlot[0].status !== 'booked') {
      return res.status(400).json({ error: 'Time slot must be booked before logging a walk' });
    }
    
    if (timeSlot[0].walker_id !== walkerId) {
      return res.status(400).json({ error: 'This time slot is booked by a different walker' });
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Create the walk record
      const walkResult = await query(
        'INSERT INTO walks (dog_id, time_slot_id, notes, status) VALUES (?, ?, ?, "completed")',
        [dogId, timeSlotId, notes]
      );

      // Update time slot status to completed
      const updateResult = await query(
        'UPDATE time_slots SET status = "completed" WHERE id = ? AND status = "booked" AND walker_id = ?',
        [timeSlotId, walkerId]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error('Failed to update time slot status');
      }

      // Commit transaction
      await query('COMMIT');

      const newWalk = {
        id: walkResult.insertId,
        dog_id: dogId,
        time_slot_id: timeSlotId,
        notes,
        status: 'completed'
      };

      console.log('Walk logged successfully:', newWalk);
      res.status(201).json(newWalk);
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error logging walk:', error);
    res.status(500).json({ 
      error: 'Failed to log walk',
      details: error.message,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
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

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});