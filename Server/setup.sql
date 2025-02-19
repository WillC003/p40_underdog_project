-- Create database if not exists
CREATE DATABASE IF NOT EXISTS udog;
USE udog;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS walks;
DROP TABLE IF EXISTS time_slots;
DROP TABLE IF EXISTS dogs;

-- Create dogs table
CREATE TABLE dogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(255),
    description TEXT,
    imageUrl VARCHAR(255),
    created_by VARCHAR(255) NOT NULL, -- Firebase UID of the creator
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create time_slots table
CREATE TABLE time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    walker_id VARCHAR(255), -- Firebase UID of the walker
    status ENUM('available', 'booked', 'completed') DEFAULT 'available',
    created_by VARCHAR(255) NOT NULL, -- Firebase UID of the creator (marshal)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create walks table
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