ALTER TABLE invoices ADD COLUMN invoice_code VARCHAR(30);

UPDATE invoices SET invoice_code = CAST(id AS VARCHAR) WHERE invoice_code IS NULL;
