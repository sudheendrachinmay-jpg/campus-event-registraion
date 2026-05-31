-- =======================================================
-- CAMPUS EVENT REGISTRATION & LOGIN SYSTEM - SCHEMA
-- =======================================================

-- Disable foreign key checks to make table recreation clean
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they already exist (reverse dependency order)
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS students;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- 1. STUDENTS TABLE
-- Stores profile and authentication details for students registering on the platform.
CREATE TABLE students (
    student_id INT AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(50) NOT NULL,
    usn VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id),
    CONSTRAINT unique_student_email UNIQUE (email),
    CONSTRAINT unique_student_usn UNIQUE (usn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. ADMINS TABLE
-- Stores administrative credentials for staff managing the campus events.
CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (admin_id),
    CONSTRAINT unique_admin_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. EVENTS TABLE
-- Stores campus events created by admins, with dates, times, venues, and seat capacities.
CREATE TABLE events (
    event_id INT AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    venue VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. REGISTRATIONS TABLE
-- Connects students to events they register for. Features cascade delete on student/event deletion.
-- Has a unique key constraint to prevent duplicate registrations for the same event by a student.
CREATE TABLE registrations (
    registration_id INT AUTO_INCREMENT,
    student_id INT NOT NULL,
    event_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (registration_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(event_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT unique_registration UNIQUE (student_id, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
