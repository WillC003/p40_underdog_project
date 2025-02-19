# P40 Underdogs Server

This is the backend server for the P40 Underdogs dog walking application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
- Copy `.env.example` to `.env`
- Update the values in `.env` with your configuration

3. Set up Firebase Service Account:
- Go to your Firebase Console > Project Settings > Service Accounts
- Click "Generate New Private Key"
- Save the downloaded JSON file as `firebase-service-account.json` in the Server directory
- Note: Never commit this file to version control!
- For development, you can copy `firebase-service-account.example.json` to `firebase-service-account.json` and fill in your credentials

4. Set up MySQL:
- Make sure MySQL is installed and running
- Create a database named 'udog'
- Update the database credentials in `.env`

5. Start the server:
```bash
# Development
npm start

# Production with PM2
pm2 start server.js
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /test-db` - Database connection test
- `GET /walkers` - Get all walkers
- `POST /walkers` - Create a new walker
- `PUT /walkers/:id` - Update a walker
- `DELETE /walkers/:id` - Delete a walker
- `GET /time-slots` - Get all time slots
- `POST /time-slots` - Create a new time slot
- `PUT /time-slots/:id/book` - Book a time slot
- `PUT /time-slots/:id/cancel` - Cancel a booking

## Database Schema

### Walkers Table
```sql
CREATE TABLE walkers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(20)
);
```

### Dogs Table
```sql
CREATE TABLE dogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(255),
    description TEXT,
    imageUrl VARCHAR(255),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Time Slots Table
```sql
CREATE TABLE time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    walker_id VARCHAR(255),
    status ENUM('available', 'booked', 'completed') DEFAULT 'available',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Walks Table
```sql
CREATE TABLE walks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dog_id INT NOT NULL,
    time_slot_id INT NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dog_id) REFERENCES dogs(id),
    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)
);
```

## Security Notes

1. Never commit sensitive credentials to version control:
   - `.env` file
   - `firebase-service-account.json`
   - Any other files containing API keys or secrets

2. Make sure to add these files to `.gitignore`

3. For team collaboration:
   - Share the template files (`.env.example`, `firebase-service-account.example.json`)
   - Securely share the actual credentials with team members (e.g., password manager, secure communication) 