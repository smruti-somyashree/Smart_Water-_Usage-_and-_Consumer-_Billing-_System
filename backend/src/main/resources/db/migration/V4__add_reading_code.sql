ALTER TABLE water_usage_logs ADD COLUMN reading_code VARCHAR(30);

UPDATE water_usage_logs SET reading_code = CONCAT('MR-', LPAD(CAST(id AS VARCHAR), 3, '0')) WHERE reading_code IS NULL;
