ALTER TABLE users ADD COLUMN name VARCHAR(100);
UPDATE users SET name = 'Biswa Resident' WHERE role = 'RESIDENT';
UPDATE users SET name = 'Enterprise Admin' WHERE role = 'ADMIN';
