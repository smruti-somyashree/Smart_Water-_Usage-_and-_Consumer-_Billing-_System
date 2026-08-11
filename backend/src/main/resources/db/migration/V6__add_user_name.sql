ALTER TABLE users ADD COLUMN name VARCHAR(100);
UPDATE users SET name = 'Biswa Resident' WHERE role = 'RESIDENT';
UPDATE users SET name = 'Community Administrator' WHERE role = 'COMMUNITY_ADMIN';
UPDATE users SET name = 'Platform Administrator' WHERE role = 'SUPER_ADMIN';
