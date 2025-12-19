# TVDControl Backend

Backend **Express + TypeScript** que expõe uma API REST para o frontend (React) e persiste em **MySQL**.

## Endpoints
- `GET /health`
- **Auth**
  - `POST /auth/login` `{ "email": "usuario@tvdoutor.com.br", "password": "..." }`
- **Users**
  - `GET /users`
  - `POST /users`
  - `PUT /users/:id`
  - `DELETE /users/:id`
- **Inventory**
  - `GET /items`
  - `GET /items/:id`
  - `POST /items`
  - `PUT /items/:id`
  - `DELETE /items/:id`
  - `GET /items/:id/history`
  - `POST /items/:id/assign` `{ "userId": "uuid" }`
  - `POST /items/:id/return`

## Configuração
1) Instale dependências:
- `cd backend`
- `npm install`

2) Crie o arquivo `.env` (localmente) copiando `backend/env.example` e preenchendo `DB_PASSWORD`:
- `PORT=8080`
- `CORS_ORIGIN=http://localhost:3000`
- `DB_HOST=...`
- `DB_PORT=3306`
- `DB_USER=...`
- `DB_PASSWORD=...`
- `DB_NAME=...`

> Observação: o ambiente do Cursor bloqueia `.env*` para edição automática; por isso o exemplo está em `env.example`.

3) Crie as tabelas no MySQL:
- Rode o SQL em `backend/db/schema.sql` no seu banco `tvdout68_tvdcontrol`.

Opcional: seed de admin para primeiro login:
- Rode `backend/db/seed_admin.sql`

4) Rode o backend:
- `npm run dev`

## Frontend
No frontend, configure:
- `VITE_API_BASE_URL=http://localhost:8080`


