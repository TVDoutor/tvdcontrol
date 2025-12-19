-- Migration 002: Atualizar roles para valores padronizados
-- Define as roles válidas: Administrador, Gerente, Usuario
-- 
-- Nota: Como role é VARCHAR(80), não precisamos alterar o schema,
-- mas vamos garantir que os valores existentes sejam atualizados se necessário

-- Atualizar roles antigas para os novos valores padronizados (se necessário)
UPDATE users 
SET role = 'Administrador' 
WHERE role IN ('Admin', 'admin', 'Administrador', 'ADMINISTRADOR');

UPDATE users 
SET role = 'Gerente' 
WHERE role IN ('Manager', 'manager', 'Gerente', 'GERENTE');

UPDATE users 
SET role = 'Usuario' 
WHERE role IN ('User', 'user', 'Usuário', 'Usuario', 'USUARIO', 'USUÁRIO');

-- Garantir que todos os usuários tenham uma role válida (default para Usuario se estiver vazio)
UPDATE users 
SET role = 'Usuario' 
WHERE role IS NULL OR role = '';

