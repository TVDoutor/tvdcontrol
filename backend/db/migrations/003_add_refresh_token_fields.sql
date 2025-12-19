-- Migration 003: adicionar colunas de refresh token na tabela users
-- Execute em bancos existentes que não possuem suporte a refresh token.
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'refresh_token_hash'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN refresh_token_hash VARCHAR(255) NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'refresh_token_expires_at'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN refresh_token_expires_at DATETIME NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
