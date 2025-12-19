# Diagramas (C4 / Mermaid) — TVDControl

## C4 — Contexto (hoje + futuro)

```mermaid
C4Context
title TVDControl - Contexto

Person(admin, "Usuário Admin", "Time de TI/Operações que gerencia inventário e usuários")

System(tvd, "TVDControl (SPA)", "Dashboard de inventário e usuários (atualmente mockado no frontend)")

Rel(admin, tvd, "Usa via navegador")

System_Ext(idp, "IdP (Futuro)", "Google/Microsoft/SSO")
System_Ext(api, "Backend API (Futuro)", "Serviço REST/GraphQL para persistência e regras")
System_Ext(db, "Banco de Dados (Futuro)", "PostgreSQL/MySQL etc.")

Rel(tvd, idp, "Autentica (OAuth/OIDC)", "HTTPS")
Rel(tvd, api, "Consome endpoints", "HTTPS/JSON")
Rel(api, db, "Lê/grava dados", "TCP")
```

## C4 — Containers (proposta de arquitetura)

```mermaid
C4Container
title TVDControl - Containers

Person(admin, "Usuário Admin")

System_Boundary(sys, "TVDControl") {
  Container(spa, "Frontend SPA", "React + Vite", "UI/UX, rotas, estado, validações")
  ContainerDb(db, "DB", "PostgreSQL", "Usuários, itens, histórico, auditoria")
  Container(api, "Backend API", "Node/.NET/Go", "Auth, regras, CRUD, auditoria, relatórios")
}

System_Ext(idp, "IdP", "Google/Microsoft (OIDC)")

Rel(admin, spa, "Acessa", "HTTPS")
Rel(spa, api, "GET/POST/PUT/DELETE", "HTTPS/JSON")
Rel(api, db, "Queries/transactions", "TCP")
Rel(spa, idp, "Login SSO", "OIDC/OAuth")
```

## C4 — Componentes (dentro do SPA)

```mermaid
C4Component
title TVDControl - Componentes do SPA

Container_Boundary(spa, "Frontend SPA") {
  Component(router, "Router", "react-router-dom", "Rotas e navegação")
  Component(layout, "Layout + Sidebar", "React", "Shell da aplicação")
  Component(pages, "Pages", "React", "Login/Dashboard/Users/Inventory/ItemDetails/AddItem")
  Component(store, "Store", "React Context", "Estado global (users hoje; inventory/auth depois)")
  Component(svc, "Services", "TS", "Camada de API (users/inventory/auth)")
  Component(http, "HttpClient", "fetch", "Client HTTP com baseUrl e erros")
}

Rel(router, pages, "Renderiza páginas por rota")
Rel(layout, pages, "Composição de UI")
Rel(pages, store, "Lê/atualiza estado")
Rel(store, svc, "Carrega/salva dados")
Rel(svc, http, "Requests HTTP (quando VITE_API_BASE_URL setado)")
```

## Fluxos principais (Mermaid)

### Fluxo: Login (hoje vs futuro)

```mermaid
flowchart TD
  A[Acessa /] --> B[Preenche email/senha]
  B --> C{Hoje}
  C -->|mock| D[Navega para /dashboard]
  B --> E{Futuro}
  E -->|POST /auth/login| F[Backend valida e retorna token]
  F --> G[Store salva sessão/token]
  G --> H[ProtectedRoute libera /dashboard]
```

### Fluxo: CRUD de Usuários (com store + service)

```mermaid
sequenceDiagram
  participant UI as Users.tsx
  participant Store as UsersStore
  participant Svc as UsersService
  participant API as Backend API (opcional)

  UI->>Store: mount()
  Store->>Svc: list()
  alt VITE_API_BASE_URL setado
    Svc->>API: GET /users
    API-->>Svc: 200 [users]
  else sem baseUrl
    Svc-->>Store: users (mock em memória)
  end
  Store-->>UI: users

  UI->>Store: createUser(payload)
  Store->>Svc: create(payload)
  alt com API
    Svc->>API: POST /users
    API-->>Svc: 201 user
  else mock
    Svc-->>Store: user
  end
  Store-->>UI: atualiza lista
```

## Proposta: “Camada de API + Store” (padrão de pastas)

Hoje eu já coloquei a base no código:
- `services/httpClient.ts`: wrapper `fetch` com `baseUrl`, JSON e erro
- `services/usersService.ts`: interface + implementação **mock** e **HTTP** (liga com `VITE_API_BASE_URL`)
- `store/UsersStore.tsx`: store de usuários (load + CRUD)
- `store/AppStoreProvider.tsx`: agregador de providers
- `vite-env.d.ts`: tipagem de `VITE_API_BASE_URL`

### Próximos “slices” sugeridos
- `services/authService.ts` + `store/AuthStore.tsx` (token, perfil, logout)
- `services/inventoryService.ts` + `store/InventoryStore.tsx` (itens, histórico, atribuições)

### Contrato de endpoints (mínimo viável)
- **Auth**
  - `POST /auth/login` → `{token, user}`
  - `POST /auth/logout`
  - `GET /me`
- **Users**
  - `GET /users`
  - `POST /users`
  - `PUT /users/:id`
  - `DELETE /users/:id`
- **Inventory**
  - `GET /items`
  - `POST /items`
  - `GET /items/:id`
  - `PUT /items/:id`
  - `DELETE /items/:id`
  - `POST /items/:id/assign` (atribuir)
  - `POST /items/:id/return` (devolver)
  - `GET /items/:id/history`

### Como ligar no backend real
No `.env.local`, definir:
- `VITE_API_BASE_URL=http://localhost:8080` (exemplo)

Sem isso, o app continua usando mock em memória.


