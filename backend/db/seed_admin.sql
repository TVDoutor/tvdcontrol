-- Seed mínimo: cria/atualiza o usuário administrador para permitir o primeiro login.
-- Requisitos do login:
-- - email termina com @tvdoutor.com.br
-- - status = 'active'
-- - password_hash preenchido (bcrypt)

INSERT INTO users (id, name, email, password_hash, role, department, avatar, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Suporte TV Doutor',
  'suporte@tvdoutor.com.br',
  '$2a$10$mC6I4ZFNh2Cn.FcdObt6WuHmEwl6wC4nOrpJZUNfLU18GdUgG2mCO',
  'Administrador',
  'TI',
  NULL,
  'active'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  department = VALUES(department),
  status = VALUES(status);


