-- Migration 005 (versão manual para phpMyAdmin / MySQL antigo)
-- Execute cada bloco separadamente. Se der "Duplicate column", a coluna já existe — pule.

-- 1. return_photo
ALTER TABLE inventory_history ADD COLUMN return_photo TEXT NULL;

-- 2. return_notes
ALTER TABLE inventory_history ADD COLUMN return_notes TEXT NULL;

-- 3. return_items
ALTER TABLE inventory_history ADD COLUMN return_items TEXT NULL;
