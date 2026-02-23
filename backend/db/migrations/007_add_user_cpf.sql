-- Migration 007: adicionar CPF opcional na tabela users (para Termo de Responsabilidade)

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'cpf'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN cpf VARCHAR(14) NULL AFTER phone'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
