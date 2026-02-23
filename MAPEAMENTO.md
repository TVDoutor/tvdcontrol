# Mapeamento do Sistema — TVDControl

## Visão geral (o que é)
- **Tipo**: aplicação **SPA** (Single Page Application) feita em **React + TypeScript**.
- **Build/Dev server**: **Vite**.
- **UI**: **Tailwind CSS via CDN** (configurado no `index.html`), ícones Google Material Symbols, fonte Inter.
- **Navegação**: `react-router-dom` usando **`HashRouter`** (URLs com `#/rota`).
- **Backend**: **Node.js + Express + TypeScript** — API REST com autenticação JWT.
- **Banco de dados**: **MySQL** (mysql2); suporta conexão remota (ex.: HostGator).
- **Persistência**: dados reais via API; fallback para mocks quando a API não está configurada.

## Como rodar
- **Instalar**: `npm install` (raiz) + dependências do backend instaladas automaticamente.
- **Rodar em dev (frontend + backend)**: `npm run dev` ou `npm run dev:full` (porta **3000** frontend, **8080** backend).
- **Rodar só frontend**: `npm run dev:frontend`
- **Rodar só backend**: `npm run dev:backend`
- **Build**: `npm run build` (gera `dist/` frontend e `backend/dist/` backend).
- **Preview frontend**: `npm run preview`
- **Rodar produção local**: `npm start` (backend com frontend embutido)

## Estrutura do repositório (pastas/arquivos principais)

### Entrada da aplicação
- `index.html`: HTML base + Tailwind CDN + tema custom.
- `index.tsx`: bootstrap React + `AppStoreProvider`.
- `App.tsx`: layout, rotas, proteção por autenticação e role.

### Páginas (telas)
- `pages/Login.tsx` — Login e cadastro (tabs) com API real.
- `pages/Dashboard.tsx` — KPIs, gráfico, filtros, export CSV, alerta estoque crítico.
- `pages/Inventory.tsx` — Lista de itens, busca, filtros, paginação, exclusão.
- `pages/ItemDetails.tsx` — Detalhe do item, edição, atribuir/devolver, histórico.
- `pages/AddItem.tsx` — Formulário de adicionar item com validação.
- `pages/Users.tsx` — Lista de usuários, drawer de detalhes, editar/criar/excluir (Administrador).
- `pages/AddUser.tsx` — Criar novo usuário (Administrador).
- `pages/Categories.tsx` — CRUD de categorias (Administrador).
- `pages/Profile.tsx` — Perfil do usuário logado, editar dados, trocar senha.

### Componentes reutilizáveis
- `components/Sidebar.tsx` — Menu lateral, perfil, logout, links por role.
- `components/Dropdown.tsx` — Dropdown genérico.
- `pages/users/components/` — `UsersTable`, `UserDrawer`, `UserDrawerParts`, `UserDeleteModal`, `AssignItemsModal`.
- `pages/addItem/components/` — `AddItemForm`, `AddItemSuccessModal`, `AddItemCancelModal`.

### Store (estado global)
- `store/AppStoreProvider.tsx` — Composição dos providers.
- `store/AuthStore.tsx` — Autenticação (user, token, login, logout).
- `store/InventoryStore.tsx` — Estado do inventário.
- `store/UsersStore.tsx` — Estado dos usuários.

### Services (camada de dados)
- `services/apiBaseUrl.ts` — URL base da API (VITE_API_BASE_URL / VITE_DEV_USE_LOCAL_BACKEND).
- `services/httpClient.ts` — Cliente HTTP com token, refresh automático, tratamento de erros.
- `services/authService.ts` — Login, registro, refresh, logout, me, updateMe, changePassword.
- `services/inventoryService.ts` — CRUD itens, histórico, atribuir, devolver; fallback mock.
- `services/usersService.ts` — CRUD usuários.
- `services/categoriesService.ts` — Listar, criar, excluir categorias; fallback mock.

### Utils
- `utils/permissions.ts` — `isAdministrator`, `canCreate`, `canRead`, `canUpdate`, `canDelete`, `canManageUsers`.

### Tipos
- `types.ts`: interfaces `User`, `InventoryItem`, `InventoryHistoryEvent`, enum `ItemStatus`, `UserRole`.

### Backend (`backend/`)
- `backend/src/index.ts` — Inicia o servidor Express (porta 8080).
- `backend/src/app.ts` — App Express (rotas, CORS, migrations); exporta `getApp()` para Vercel.
- `backend/src/config.ts` — Porta, CORS, DB, JWT.
- `backend/src/db.ts` — Pool MySQL.
- `backend/src/routes/auth.ts` — Login, register, refresh, logout, me, updateMe, changePassword.
- `backend/src/routes/users.ts` — CRUD usuários.
- `backend/src/routes/items.ts` — CRUD itens, histórico, atribuir, devolver.
- `backend/src/routes/categories.ts` — CRUD categorias.
- `backend/src/utils/` — auth, password, permissions, token, uuid.
- `backend/db/` — schema.sql, migrations, seed_admin.sql.

### Deploy Vercel
- `api/[[...path]].ts` — Serverless handler que encaminha `/api/*` para o Express.
- `vercel.json` — Build (frontend + backend), rewrites SPA, output.
- `VERCEL.md` — Instruções de deploy e variáveis de ambiente.

### Outros
- `vite.config.ts` — Porta 3000, alias `@`, env (Gemini).
- `metadata.json` — Metadados do app.
- `index.css` — Placeholder (Tailwind via CDN).
- `php-app/` — Aplicação PHP paralela (legada/alternativa).

## Rotas (mapa de navegação)

| Rota | Componente | Proteção |
|------|------------|----------|
| `/` | Login | Pública |
| `/dashboard` | Dashboard | Autenticado |
| `/inventory` | Inventory | Autenticado |
| `/users` | Users | Administrador |
| `/users/add` | AddUser | Administrador |
| `/categories` | Categories | Administrador |
| `/profile` | Profile | Autenticado |
| `/item/:id` | ItemDetails | Autenticado |
| `/items/add` | AddItem | Autenticado |

### Layout global
- O `Layout` **omite Sidebar** quando a rota é `/` (login).
- Para as demais rotas: `Sidebar` (responsivo), header mobile, conteúdo.
- `Protected` — redireciona para `/` se não autenticado.
- `RequireRole` — redireciona para `/dashboard` com mensagem de flash se a role não for permitida.

## API REST (backend)

### Autenticação (`/auth`)
- `POST /auth/login` — Login (email, senha); retorna user + token; cookie refresh.
- `POST /auth/register` — Cadastro; retorna user + token.
- `POST /auth/refresh` — Renova access token via cookie refresh.
- `POST /auth/logout` — Invalida refresh token.
- `GET /auth/me` — Dados do usuário logado (requer token).
- `PUT /auth/me` — Atualizar perfil (nome, departamento, avatar).
- `PUT /auth/me/password` — Trocar senha.

### Usuários (`/users`)
- `GET /users` — Lista (filtros, ordenação).
- `GET /users/:id` — Detalhe.
- `POST /users` — Criar.
- `PUT /users/:id` — Atualizar.
- `DELETE /users/:id` — Excluir.

### Itens (`/items`)
- `GET /items` — Lista (filtros).
- `GET /items/:id` — Detalhe.
- `GET /items/meta/next-asset-tag` — Próxima tag de ativo.
- `POST /items` — Criar.
- `PUT /items/:id` — Atualizar.
- `DELETE /items/:id` — Excluir.
- `GET /items/:id/history` — Histórico do item.
- `POST /items/:id/assign` — Atribuir a usuário.
- `POST /items/:id/return` — Devolver item.

### Categorias (`/categories`)
- `GET /categories` — Lista.
- `POST /categories` — Criar.
- `DELETE /categories/:id` — Excluir.

### Health
- `GET /health` — Health check (com teste de conexão ao banco).

## Modelo de dados (conceitual)

### `User`
- `id`, `name`, `email`, `role` (Administrador | Gerente | Usuario), `department`, `avatar`, `itemsCount`, `status` (active | inactive).

### `InventoryItem`
- `id`, `serialNumber`, `model`, `manufacturer`, `category`, `status` (available | in_use | maintenance | retired), `assignedTo`, `purchaseDate`, `warrantyEnd`, `location`, `specs`, `notes`, etc.

### `Category`
- `id`, `name`, `createdAt`, `updatedAt`.

## Fluxos principais

### 1) Login / Cadastro
- **Tela**: `Login.tsx`
- Login com email e senha; cadastro com nome, email, senha.
- JWT (access token em memória/localStorage) + refresh token em cookie HTTP-only.
- "Lembrar me por 30 dias" prolonga o refresh token.
- Redireciona para rota de origem após login ou para `/dashboard`.

### 2) Dashboard
- Dados da API (inventoryService) ou mocks.
- KPIs, gráfico Recharts, busca/filtros, export CSV.
- Alerta de estoque crítico (qty ≤ 2).
- Navega para `/item/:id` ao clicar em item crítico.

### 3) Inventário
- Lista da API com busca, filtros, paginação.
- Exclusão com modal de confirmação.
- Navega para `/item/:id` ao clicar na linha.
- Botões: ver, editar, excluir.

### 4) Detalhe do Item
- Visualização/edição; atribuir usuário / devolver item.
- Histórico completo (timeline).
- Dados e histórico da API.

### 5) Adicionar Item
- Formulário com validação; categorias da API ou mock.
- Modal de sucesso; redireciona para o item criado.
- Modal de cancelamento se houver dados preenchidos.

### 6) Usuários
- Lista, busca, drawer de detalhes.
- Editar, criar, excluir (modal de confirmação).
- Ativar/desativar; atribuir itens (AssignItemsModal).
- Restrito a Administrador.

### 7) Categorias
- Lista, criar, excluir.
- Restrito a Administrador.

### 8) Perfil
- Editar nome, departamento, avatar.
- Trocar senha.
- Dados do usuário logado.

## Autenticação e segurança
- **JWT**: access token (Header `Authorization: Bearer`) com expiração configurável.
- **Refresh token**: em cookie HTTP-only; usado em `/auth/refresh` para renovar o access token.
- **Proteção de rotas**: `Protected` (autenticado) e `RequireRole` (role mínima).
- **Permissões**: `canCreate`, `canRead`, `canUpdate`, `canDelete`, `canManageUsers` (Administrador).
- **HttpClient**: refresh automático em 401; tratamento de erros com mensagens amigáveis.

## Integrações e configurações
- **API**: URL base via `VITE_API_BASE_URL` ou `VITE_DEV_USE_LOCAL_BACKEND=true` em dev.
- **MySQL**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (`.env.local` ou variáveis de ambiente).
- **JWT**: `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `JWT_REFRESH_COOKIE`.
- **CORS**: configurável via `CORS_ORIGIN`; inclui automaticamente domínio Vercel em deploy.
- **Gemini API**: configurado no Vite, não utilizado atualmente.

## Deploy

### Local (produção)
- `npm run build` → `npm start` — Backend serve o frontend em `dist/`.

### Vercel
- Frontend estático + API como Serverless Function em `/api/*`.
- Variáveis obrigatórias: `VITE_API_BASE_URL`, `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- MySQL externo (ex.: HostGator); habilitar acesso remoto no painel da hospedagem.
- Ver `VERCEL.md` para detalhes.

## Pontos para evolução
- **Tailwind**: migrar do CDN para build (PostCSS/CLI) para produção.
- **HashRouter → BrowserRouter**: se usar domínio próprio e suporte a rewrites (ex.: Vercel).
