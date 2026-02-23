-- Migration 004: adicionar colunas para fotos de equipamentos
-- photo_main: foto do equipamento no cadastro
-- return_photo: foto do equipamento na devolução (evento no histórico)

-- inventory_items.photo_main
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_items' AND COLUMN_NAME = 'photo_main'
    ),
    'SELECT 1',
    'ALTER TABLE inventory_items ADD COLUMN photo_main TEXT NULL AFTER notes'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- inventory_history.return_photo
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_history' AND COLUMN_NAME = 'return_photo'
    ),
    'SELECT 1',
    'ALTER TABLE inventory_history ADD COLUMN return_photo TEXT NULL AFTER description'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
