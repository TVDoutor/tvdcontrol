# Funcionalidades Existentes — TVDControl

## Frontend (SPA React + Vite)
- Autenticação: login e cadastro com validações de email/senha e confirmação de senha.
- Lembrar login: salva email quando “lembrar-me” está ativo.
- Sessão: armazena token e usuário no localStorage, com atualização automática via evento.
- Proteção de rotas: bloqueio de acesso sem autenticação.
- Controle por role: acesso a “Usuários” apenas para Administrador.
- Sidebar responsiva: navegação, perfil e logout.
- Perfil do usuário: editar nome, departamento e avatar.
- Troca de senha no perfil: validações e feedback de sucesso.
- Dashboard: KPIs de inventário, gráfico por categoria, busca e filtros.
- Exportação CSV: exportar itens filtrados do dashboard.
- Inventário (lista): busca, filtros, paginação, ver/editar/excluir itens.
- Detalhe do item: visualizar e editar dados, validação de datas, preço formatado.
- Atribuição de item: atribuir a usuário e devolver ao estoque.
- Histórico do item: lista e modal com timeline.
- Adicionar item: formulário completo com validações e modais de sucesso/cancelamento.
- Upload de avatar: compressão local e validações de tamanho/formato.
- Componentes de UI reutilizáveis: dropdown com overlay, modais, drawers.

## Serviços e Stores (SPA)
- HttpClient: adiciona Bearer token, tenta refresh automático e padroniza erros.
- AuthService: login, register, me, update, change password, refresh, logout.
- InventoryService: list, get, create, update, delete, history, assign, return.
- UsersService: list, create, update, delete.
- Stores (React Context): AuthStore, InventoryStore, UsersStore com cache local e sync.

## Backend Node/Express (API)
- Healthcheck: `GET /health`.
- Auth: `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/logout`.
- Perfil: `GET /auth/me`, `PUT /auth/me`, `PUT /auth/me/password`.
- Usuários (admin): `GET /users`, `GET /users/:id`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id`.
- Itens: `GET /items`, `GET /items/:id`, `POST /items`, `PUT /items/:id`, `DELETE /items/:id`.
- Histórico de itens: `GET /items/:id/history`.
- Atribuição de itens: `POST /items/:id/assign`, `POST /items/:id/return`.
- Permissões por role: regras para criar/editar/excluir itens e gerenciar usuários.
- Tokens: access token assinado (HMAC) e refresh token via cookie HTTP-only.

## Banco de Dados (MySQL)
- Tabelas: `users`, `inventory_items`, `inventory_history`.
- Índices e constraints: chaves únicas e FKs para atribuição e histórico.
- Seed de admin: usuário inicial para primeiro login.

## PHP App (alternativo)
- API de autenticação: login, register, me, update profile, change password, logout.
- Recuperação de senha (PHP): forgot-password e reset-password.
- API de usuários (admin): list, get, create, update, delete.
- API de itens: list, get, create, update, delete.
- Router simples para páginas e API.

## Deploy/Infra
- Vercel: build de frontend + backend, proxy `/api/*` para Express.
- Docker: build completo e execução do backend servindo o `dist` do frontend.
