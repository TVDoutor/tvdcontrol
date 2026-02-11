# TVDControl - Aplicação PHP

Aplicação de gerenciamento de inventário convertida de Node.js/React para PHP + Tailwind CSS + JavaScript Vanilla.

## 📋 Requisitos

- **PHP** 8.0 ou superior
- **MySQL** 5.7+ ou MariaDB 10.3+
- **Apache** (com mod_rewrite habilitado) ou **Nginx**
- **Composer** (opcional, não necessário para versão atual)

## 🚀 Instalação

### 1. Configurar Banco de Dados

Use o mesmo banco de dados MySQL do projeto Node.js original. Se ainda não tiver, execute os scripts SQL em `backend/db/` para criar as tabelas.

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` da raiz do projeto para arquivo `.env`:

```bash
cp ../env.local config/.env
```

Ou crie um novo `.env` em `config/` com as configurações:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=tvdcontrol
JWT_SECRET=seu-secret-aqui
```

### 3. Compilar Tailwind CSS

Da raiz do projeto, execute:

```bash
npm run tailwind:build
```

Para desenvolvimento com watch mode:

```bash
npm run tailwind:watch
```

### 4. Configurar Apache

**Opção A: Virtual Host**

Crie um virtual host apontando para a pasta `php-app/`:

```apache
<VirtualHost *:80>
    ServerName tvdcontrol.local
    DocumentRoot "C:/caminho/para/TVDControl/php-app"
    
    <Directory "C:/caminho/para/TVDControl/php-app">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Adicione ao arquivo `hosts`:
```
127.0.0.1 tvdcontrol.local
```

**Opção B: Subpasta**

Se estiver rodando via `localhost/php-app/`, ajuste o `RewriteBase` no `.htaccess` para `/php-app/`

### 5. Acessar Aplicação

Abra no navegador:
- http://tvdcontrol.local (se configurou virtual host)
- http://localhost/php-app/ (se rodando diretamente)

## 📁 Estrutura do Projeto

```
php-app/
├── api/                  # Endpoints REST API
│   ├── index.php         # Router principal
│   ├── auth.php          # Autenticação (login, register)
│   ├── users.php         # CRUD de usuários
│   └── items.php         # CRUD de itens
├── assets/
│   ├── css/
│   │   ├── input.css     # Tailwind source
│   │   └── output.css    # Tailwind compilado
│   └── js/               # JavaScript modules
├── config/
│   ├── config.php        # Configurações globais
│   └── database.php      # Classe Database (PDO)
├── includes/             # Templates reutilizáveis
│   ├── head.php
│   ├── header.php
│   ├── sidebar.php
│   └── footer.php
├── middleware/
│   └── AuthMiddleware.php
├── pages/                # Páginas da aplicação
│   ├── login.php
│   ├── dashboard.php
│   ├── inventory.php
│   └── ...
├── utils/                # Utilitários
│   ├── Auth.php          # JWT + Senha
│   ├── UUID.php
│   └── Response.php
├── .htaccess             # Regras de rewrite
└── index.php             # Entry point
``

## 🔑 Login Padrão

Se você executou os seeds do banco Node.js, use:
- **Email:** admin@tvdcontrol.com
- **Senha:** admin123

Ou crie um novo usuário através da tela de registro.

## 🛠️ Desenvolvimento

### Compilar Tailwind CSS (watch mode)

```bash
npm run tailwind:watch
```

### Estrutura de Rotas

- `/` → Redireciona para `/login` ou `/dashboard`
- `/login` → Página de login/registro
- `/dashboard` → Dashboard principal
- `/inventory` → Lista de itens
- `/item/:id` → Detalhes do item
- `/add-item` → Adicionar item
- `/users` → Gerenciar usuários (admin only)
- `/profile` → Perfil do usuário

### API Endpoints

Todas as APIs estão em `/api/*`:

**Autenticação:**
- POST `/api/auth/login`
- POST `/api/auth/register`
- GET `/api/auth/me`
- PUT `/api/auth/me`
- PUT `/api/auth/me/password`

**Usuários (admin only):**
- GET `/api/users`
- POST `/api/users`
- GET `/api/users/:id`
- PUT `/api/users/:id`
- DELETE `/api/users/:id`

**Itens:**
- GET `/api/items`
- POST `/api/items`
- GET `/api/items/:id`
- PUT `/api/items/:id`
- DELETE `/api/items/:id`

## 🚀 Deploy em Produção

1. Compile o Tailwind CSS com minificação:
   ```bash
   npm run tailwind:build
   ```

2. Configure variáveis de ambiente em `config/.env`:
   ```
   NODE_ENV=production
   JWT_SECRET=gere-um-secret-forte
   DB_HOST=seu-host-producao
   ```

3. Certifique-se que Apache tem `mod_rewrite` habilitado

4. Ajuste permissões de arquivos:
   ```bash
   chmod 644 config/.env
   chmod 755 php-app/
   ```

## 📝 Observações

- JWT é stateless (sem refresh token via cookies nesta versão PHP simplificada)
- Os tokens são armazenados no `localStorage` via JavaScript
- Dark mode está configurado no Tailwind, mas não há toggle implementado nas páginas ainda
- A autenticação é feita via Authorization header (`Bearer <token>`)

## 🐛 Troubleshooting

**Erro 404 em todas as rotas:**
- Verifique se mod_rewrite está habilitado
- Verifique se `.htaccess` está na raiz de `php-app/`

**Erro de conexão com banco:**
- Verifique credenciais em `config/.env`
- Certifique-se que MySQL está rodando
- Teste conexão com `mysql -u root -p`

**CSS não carrega:**
- Execute `npm run tailwind:build`
- Verifique se `assets/css/output.css` foi criado
- Limpe cache do navegador
