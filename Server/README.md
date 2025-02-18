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

3. Set up MySQL:
- Make sure MySQL is installed and running
- Create a database named 'udog'
- Update the database credentials in `.env`

4. Start the server:
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
    imageUrl VARCHAR(255)
);
```

### Time Slots Table
```sql
CREATE TABLE time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    walker_id INT,
    status ENUM('available', 'booked', 'completed') DEFAULT 'available',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (walker_id) REFERENCES walkers(id)
);
``` 