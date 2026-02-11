-- Migration para adicionar suporte a recuperação de senha
-- Execute este script no seu banco de dados MySQL

ALTER TABLE users 
ADD COLUMN reset_token_hash VARCHAR(255) NULL AFTER password_hash,
ADD COLUMN reset_token_expires_at DATETIME NULL AFTER reset_token_hash;

-- Fim da migration
