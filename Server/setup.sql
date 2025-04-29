-- Create database
CREATE DATABASE IF NOT EXISTS p40_underdogs;
USE p40_underdogs;

-- Walkers table (Firebase UIDs)
CREATE TABLE walkers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phoneNumber VARCHAR(20),
  role ENUM('walker', 'marshal', 'admin') DEFAULT 'walker',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dogs table
CREATE TABLE dogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  breed VARCHAR(255),
  description TEXT,
  imageUrl TEXT,
  grade ENUM('grey', 'maroon', 'gold') DEFAULT 'grey',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time slots table
CREATE TABLE time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  created_by VARCHAR(255),
  status ENUM('available', 'booked', 'completed', 'cancelled', 'blocked') DEFAULT 'available',
  type ENUM('normal', 'blocked') DEFAULT 'normal',
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time slot bookings table
CREATE TABLE time_slot_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  time_slot_id INT NOT NULL,
  walker_id VARCHAR(255) NOT NULL,
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Walks table (completed walks)
CREATE TABLE walks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  time_slot_id INT NOT NULL,
  walker_id VARCHAR(255) NOT NULL,
  dog_id INT NOT NULL,
  status ENUM('completed', 'cancelled') DEFAULT 'completed',
  notes TEXT,
  walked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assigned dogs to time slots
CREATE TABLE time_slot_dogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  time_slot_id INT NOT NULL,
  dog_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);