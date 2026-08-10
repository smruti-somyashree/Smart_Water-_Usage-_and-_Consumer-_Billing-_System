ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'APPROVED';

-- Ensure all pre-seeded and existing accounts are marked APPROVED
UPDATE users SET status = 'APPROVED';
