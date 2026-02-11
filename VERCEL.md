# Deploy na Vercel (frontend + backend)

O projeto está configurado para rodar **frontend e backend** na Vercel. O backend vira uma Serverless Function em `/api/*`.

## Variáveis de ambiente (obrigatórias)

No painel da Vercel: **Project → Settings → Environment Variables**. Use **Production** (e opcionalmente Preview).

| Nome | Descrição |
|------|-----------|
| `VITE_API_BASE_URL` | Use **`/api`** para que o frontend chame a API no mesmo domínio. |
| `JWT_SECRET` | Chave secreta para tokens (ex.: string aleatória longa). |
| `DB_HOST` | Host do MySQL. |
| `DB_PORT` | Porta (geralmente `3306`). |
| `DB_USER` | Usuário do banco. |
| `DB_PASSWORD` | Senha do banco. |
| `DB_NAME` | Nome do banco. |

Opcionais:

- `CORS_ORIGIN` – Lista de origens permitidas separadas por vírgula (em produção na Vercel a própria URL do deploy já é aceita).
- `JWT_EXPIRES_IN` – Segundos até o access token expirar (padrão: 86400).
- `JWT_REFRESH_EXPIRES_IN` – Segundos até o refresh token expirar (padrão: 2592000).

## Build

O comando de build já está no `vercel.json`:

1. Instala dependências do backend.
2. Compila o backend (`backend/dist`).
3. Compila o frontend (Vite → `dist`).

As rotas `/api/*` são tratadas pela função em `api/[[...path]].ts`, que repassa as requisições para o app Express.

## Resumo

- **Frontend:** servido como estático a partir de `dist`.
- **API:** `/api/auth/*`, `/api/users/*`, `/api/items/*`, `/api/health` são atendidas pelo backend em modo serverless.
- **Banco:** MySQL externo (ex.: plano na Vercel, Railway, ou seu próprio servidor). A Vercel não oferece MySQL; use um serviço externo.
