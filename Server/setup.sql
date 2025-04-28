-- Create database if not exists
CREATE DATABASE IF NOT EXISTS udog;
USE udog;

-- Walkers Table
CREATE TABLE walkers (
  id VARCHAR(255) PRIMARY KEY, -- Firebase UID
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20)
);

-- Dogs Table
CREATE TABLE dogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  breed VARCHAR(255) NOT NULL,
  description TEXT,
  imageUrl TEXT,
  created_by VARCHAR(255), -- Firebase UID of creator (admin or marshal)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES walkers(id) ON DELETE SET NULL
);

-- Time Slots Table
CREATE TABLE time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status VARCHAR(20) DEFAULT 'available', -- available, booked, completed
  created_by VARCHAR(255), -- Firebase UID of the marshal who created it
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES walkers(id) ON DELETE SET NULL
);

-- Time Slot Bookings Table (join table for walkers booking time slots)
CREATE TABLE time_slot_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  time_slot_id INT NOT NULL,
  walker_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (walker_id) REFERENCES walkers(id) ON DELETE CASCADE
);

-- Walks Table (completed walks)
CREATE TABLE walks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dog_id INT NOT NULL,
  walker_id VARCHAR(255) NOT NULL,
  time_slot_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'completed', -- completed, cancelled, etc.
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE,
  FOREIGN KEY (walker_id) REFERENCES walkers(id) ON DELETE CASCADE,
  FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE
);
