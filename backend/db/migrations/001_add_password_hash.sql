-- Migration 001: add password_hash to existing users table.
-- Execute this on databases that were created before password support.
-- Step 1: add as NULL to avoid failing on existing rows.
ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER email;

-- After you set passwords for ALL rows, you can enforce NOT NULL:
-- ALTER TABLE users MODIFY password_hash VARCHAR(255) NOT NULL;


