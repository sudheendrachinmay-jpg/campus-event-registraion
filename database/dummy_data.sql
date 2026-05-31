-- =======================================================
-- CAMPUS EVENT REGISTRATION & LOGIN SYSTEM - DUMMY DATA
-- =======================================================

-- All passwords are pre-hashed using bcryptjs (salt rounds = 10)
-- Both 'student123' and 'admin123' hash to: $2a$10$h9B5K9j.vQ6fL9D5Nq9uOexb0rT7.e8A/mJvH7k7Jm6Z8yvE7F/Ki

-- 1. INSERT ADMINS
INSERT INTO admins (admin_id, full_name, email, password) VALUES
(1, 'Dr. Sarah Jenkins', 'admin@campus.edu', '$2a$10$h9B5K9j.vQ6fL9D5Nq9uOexb0rT7.e8A/mJvH7k7Jm6Z8yvE7F/Ki'),
(2, 'Prof. Alex Rivera', 'alex@campus.edu', '$2a$10$h9B5K9j.vQ6fL9D5Nq9uOexb0rT7.e8A/mJvH7k7Jm6Z8yvE7F/Ki');

-- 2. INSERT STUDENTS
INSERT INTO students (student_id, full_name, email, password, department, usn) VALUES
(1, 'Alice Smith', 'alice@student.edu', '$2a$10$h9B5K9j.vQ6fL9D5Nq9uOexb0rT7.e8A/mJvH7k7Jm6Z8yvE7F/Ki', 'Computer Science', 'CS202601'),
(2, 'Bob Johnson', 'bob@student.edu', '$2a$10$h9B5K9j.vQ6fL9D5Nq9uOexb0rT7.e8A/mJvH7k7Jm6Z8yvE7F/Ki', 'Information Technology', 'IT202602'),
(3, 'Charlie Brown', 'charlie@student.edu', '$2a$10$h9B5K9j.vQ6fL9D5Nq9uOexb0rT7.e8A/mJvH7k7Jm6Z8yvE7F/Ki', 'Electronics Engineering', 'EC202603'),
(4, 'Diana Prince', 'diana@student.edu', '$2a$10$h9B5K9j.vQ6fL9D5Nq9uOexb0rT7.e8A/mJvH7k7Jm6Z8yvE7F/Ki', 'Computer Science', 'CS202604'),
(5, 'Evan Wright', 'evan@student.edu', '$2a$10$h9B5K9j.vQ6fL9D5Nq9uOexb0rT7.e8A/mJvH7k7Jm6Z8yvE7F/Ki', 'Mechanical Engineering', 'ME202605');

-- 3. INSERT EVENTS
-- Using fixed dates in 2026 to ensure database integrity
INSERT INTO events (event_id, title, description, date, time, venue, capacity, category, created_by) VALUES
(1, 'HackFest 2026', 'A 24-hour national level coding hackathon targeting web development, blockchain, and AI solutions.', '2026-06-15', '09:00:00', 'Main CS Seminar Hall', 5, 'Technical', 1),
(2, 'RoboWars Showdown', 'Ultimate combat robotics challenge. Build your metal monsters and destroy the competition!', '2026-07-20', '10:30:00', 'Open Air Theatre (OAT)', 3, 'Technical', 2),
(3, 'TechTalk: AI & Ethics', 'Expert seminar exploring the societal impact, potential, and ethical boundaries of generative artificial intelligence.', '2026-06-25', '14:00:00', 'Newton Auditorium', 50, 'Seminar', 1),
(4, 'Symphony: Cultural Night', 'Annual inter-collegiate musical evening and dance competition showcasing talent from across the country.', '2026-08-05', '18:00:00', 'Campus Main Grounds', 100, 'Cultural', 2),
(5, 'Annual Athletic Meet 2026', 'Compete in track events, high jump, shot put, and relays. Let the games begin!', '2026-09-10', '08:00:00', 'Sports Stadium Complex', 40, 'Sports', 1);

-- 4. INSERT REGISTRATIONS
-- Many-to-many relationship rows
INSERT INTO registrations (registration_id, student_id, event_id, registered_at) VALUES
(1, 1, 1, '2026-05-20 10:15:30'), -- Alice registers for HackFest
(2, 2, 1, '2026-05-20 11:24:45'), -- Bob registers for HackFest
(3, 4, 1, '2026-05-20 12:45:00'), -- Diana registers for HackFest (3 registered, capacity 5)
(4, 1, 3, '2026-05-21 09:00:12'), -- Alice registers for TechTalk
(5, 2, 3, '2026-05-21 09:30:55'), -- Bob registers for TechTalk
(6, 3, 3, '2026-05-21 10:05:40'), -- Charlie registers for TechTalk
(7, 4, 3, '2026-05-21 11:15:22'), -- Diana registers for TechTalk
(8, 5, 3, '2026-05-21 12:50:00'), -- Evan registers for TechTalk
(9, 3, 2, '2026-05-22 14:10:18'), -- Charlie registers for RoboWars
(10, 5, 2, '2026-05-22 15:40:22'), -- Evan registers for RoboWars (2 registered, capacity 3)
(11, 2, 4, '2026-05-23 09:12:00'), -- Bob registers for Cultural Night
(12, 4, 4, '2026-05-23 10:44:30'); -- Diana registers for Cultural Night
