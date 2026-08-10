ALTER TABLE billing_cycles ADD COLUMN cycle_code VARCHAR(30);
ALTER TABLE water_purchases ADD COLUMN procurement_code VARCHAR(30);

UPDATE billing_cycles SET cycle_code = CONCAT('BC-', LPAD(CAST(id AS VARCHAR), 3, '0')) WHERE cycle_code IS NULL;
UPDATE water_purchases SET procurement_code = CONCAT('PR-', LPAD(CAST(id AS VARCHAR), 3, '0')) WHERE procurement_code IS NULL;
