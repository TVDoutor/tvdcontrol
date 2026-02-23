-- Migration 005: adicionar return_notes e return_items na devolução
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_history' AND COLUMN_NAME = 'return_notes'
    ),
    'SELECT 1',
    'ALTER TABLE inventory_history ADD COLUMN return_notes TEXT NULL AFTER return_photo'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_history' AND COLUMN_NAME = 'return_items'
    ),
    'SELECT 1',
    'ALTER TABLE inventory_history ADD COLUMN return_items TEXT NULL AFTER return_notes'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
