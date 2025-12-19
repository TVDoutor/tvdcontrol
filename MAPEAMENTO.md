# Mapeamento do Sistema — TVDControl

## Visão geral (o que é)
- **Tipo**: aplicação **SPA** (Single Page Application) feita em **React + TypeScript**.
- **Build/Dev server**: **Vite**.
- **UI**: **Tailwind CSS via CDN** (configurado no `index.html`), ícones do Google Material Symbols, fonte Inter.
- **Navegação**: `react-router-dom` usando **`HashRouter`** (URLs com `#/rota`), ideal para deploy simples em hosting estático.
- **Persistência / Backend**: **não existe ainda**. Os dados (usuários/itens) são **mockados** em arrays e controlados por `useState`.

## Como rodar
- **Instalar**: `npm install`
- **Rodar em dev**: `npm run dev` (porta **3000** — ver `vite.config.ts`)
- **Build**: `npm run build` (gera `dist/`)
- **Preview**: `npm run preview`

## Estrutura do repositório (pastas/arquivos principais)
- **Entrada da aplicação**
  - `index.html`: HTML base + Tailwind CDN + importmap.
  - `index.tsx`: bootstrap React (`ReactDOM.createRoot`).
  - `App.tsx`: layout + rotas.
- **Páginas (telas)**
  - `pages/Login.tsx`
  - `pages/Dashboard.tsx`
  - `pages/Inventory.tsx`
  - `pages/ItemDetails.tsx`
  - `pages/AddItem.tsx`
  - `pages/Users.tsx`
- **Componentes reutilizáveis**
  - `components/Sidebar.tsx`: menu lateral + perfil/logout.
- **Tipos**
  - `types.ts`: interfaces `User`, `InventoryItem`, enum `ItemStatus`.
- **Build output**
  - `dist/`: artefatos gerados pelo Vite.
- **Outros**
  - `vite.config.ts`: porta 3000 + alias `@` + env do Gemini (não usado no app atualmente).
  - `metadata.json`: metadados do app.
  - `tvdcontrol/`: pasta presente, mas **vazia** no repo atual.
  - `index.css`: arquivo “placeholder” para evitar 404 (o Tailwind vem do CDN).

## Rotas (mapa de navegação)
As rotas estão definidas em `App.tsx`:
- `/` → `Login`
- `/dashboard` → `Dashboard`
- `/inventory` → `Inventory`
- `/users` → `Users`
- `/item/:id` → `ItemDetails`
- `/items/add` → `AddItem`

### Layout global
- O `Layout` em `App.tsx` **omite Sidebar** quando a rota é `/` (login).
- Para todas as outras rotas, ele renderiza:
  - `Sidebar` (responsivo; no mobile abre/fecha)
  - Header mobile (hambúrguer)
  - `children` (conteúdo da página)

## Modelo de dados (conceitual)
### `User` (`types.ts`)
- Campos principais: `id`, `name`, `email`, `role`, `department`, `avatar`, `itemsCount`, `status`.

### `InventoryItem` (`types.ts`)
- Campos principais: `id`, `serialNumber`, `model`, `manufacturer`, `category`, `status`, `assignedTo`, `purchaseDate`, `warrantyEnd`, etc.

> Observação: várias telas usam **shapes diferentes** (ex.: `Dashboard` usa `{id, name, qty, status}`, `Inventory` usa `{id, name, location, purchaseDate, status}`), porque são mocks locais por página.

## Fluxos principais (o que o usuário faz no sistema)

### 1) Login/Cadastro
- **Tela**: `pages/Login.tsx`
- **Como funciona hoje**: valida email e (no cadastro) confirmação de senha; depois faz `setTimeout` e navega para `/dashboard`.
- **Não existe**: sessão/token, “lembrar-me”, integração com Google/Microsoft (botões são apenas UI).

### 2) Dashboard (visão geral + alerta de estoque)
- **Tela**: `pages/Dashboard.tsx`
- **Dados**: `initialInventoryData` (mock local).
- **Funcionalidades**:
  - KPIs estáticos (cards)
  - gráfico `recharts` (dados `chartData`)
  - busca + filtros (categoria/status)
  - export CSV do “grid” filtrado (gera Blob e baixa `inventario_export.csv`)
  - alerta de “estoque crítico” para `qty <= 2` (modal automático após 1s)
  - ao clicar no item crítico: navega para `/item/:id`

### 3) Inventário (lista completa + filtros + paginação + delete)
- **Tela**: `pages/Inventory.tsx`
- **Dados**: `mockInventoryItems` (mock local).
- **Funcionalidades**:
  - busca (nome/desc/sku/local)
  - filtros (categoria/status)
  - paginação simples (5 por página)
  - exclusão com modal (remove do `useState`)
  - clique na linha: navega para `/item/:id`
  - botões: ver, editar (passa `state: { editMode: true }`), excluir

### 4) Detalhe do Item (visualizar/editar + atribuir/devolver + histórico)
- **Tela**: `pages/ItemDetails.tsx`
- **Dados**: totalmente mockado em estados locais:
  - `assignedUser` (para simular “Em uso” vs “Disponível”)
  - `historyEvents` (timeline; adiciona eventos ao atribuir/devolver)
  - `formData` (dados do item editável)
- **Edição**:
  - entra em modo edição se navegar com `location.state.editMode === true`
  - valida datas de compra/garantia antes de “Salvar”
- **Atribuição**:
  - “Devolver item” → zera `assignedUser` + cria evento `success`
  - “Atribuir usuário” → define novo `assignedUser` + cria evento `primary`
- **Histórico completo**: modal com timeline.

### 5) Adicionar Item (form + validação + sucesso)
- **Tela**: `pages/AddItem.tsx`
- **Dados**: `formData` em `useState`, com validação client-side.
- **Funcionalidades**:
  - dropdown de categoria custom (com ícone)
  - valida campos obrigatórios + valida datas
  - “Salvar item” simula API (timeout) e mostra modal de sucesso
  - depois redireciona para `/item/1` (fixo, mock)
  - cancelar: modal se tiver dados preenchidos, senão volta pro dashboard

### 6) Usuários (lista + drawer de detalhes + editar/criar/excluir)
- **Tela**: `pages/Users.tsx`
- **Dados**: `initialMockUsers` (mock local) tipado como `User`.
- **Funcionalidades**:
  - busca por nome/email/id
  - seleção abre “drawer” lateral (no desktop) / tela sobreposta (mobile)
  - editar: valida nome/email
  - criar usuário: cria template com `id = Date.now().toString()`
  - excluir: modal de confirmação (remove do `useState`)
  - ativar/desativar: toggla `status` no estado
  - integração com Sidebar: `Sidebar` manda `navigate('/users', { state: { targetUserId: 'admin', editMode: true } })`

## Integrações e configurações
- **APIs externas**: não há chamadas HTTP no código.
- **Gemini API**: `vite.config.ts` injeta `GEMINI_API_KEY` em `process.env.*`, mas **não existe uso no app** atualmente.
- **Tema dark**: Tailwind está em `darkMode: "class"` no `index.html`, mas **não achei** toggle/controle de `document.documentElement.classList`.

## Pontos importantes / “onde mexer” (para evoluir para produção)
- **Estado global**: hoje cada página tem seus próprios mocks; para consistência, criar um `store` (Context/Zustand/Redux) ou camada de `services`.
- **Persistência**: trocar mocks por API real (ex.: `services/api.ts`) e modelos unificados (`InventoryItem`, `User`).
- **Autenticação**: implementar sessão/token + proteção de rotas (ex.: wrapper `ProtectedRoute` em `App.tsx`).
- **Rotas faltando**: `Users.tsx` navega para `/users/:id`, mas não existe rota correspondente em `App.tsx` (hoje isso vai para “pagina em branco”).
- **Tailwind via CDN**: ok para protótipo; para produção, migrar para Tailwind via build (postcss) para reduzir payload e garantir versão.


