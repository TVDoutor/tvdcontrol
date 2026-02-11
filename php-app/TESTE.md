# Guia de Teste - TVDControl PHP

## 🚀 Passo a Passo para Testar

### 1. Verificar Banco de Dados

Certifique-se que o MySQL está rodando e o banco `tvdcontrol` existe com as tabelas criadas.

**Opções:**
- Use o mesmo banco de dados do projeto Node.js
- Ou execute os scripts SQL em `backend/db/` para criar as tabelas

### 2. Configurar Variáveis de Ambiente

✅ Arquivo `.env` já foi criado em `php-app/config/.env`

Edite se necessário para ajustar:
- `DB_USER` (padrão: root)
- `DB_PASSWORD` (padrão: vazio)
- `DB_NAME` (padrão: tvdcontrol)

### 3. Iniciar Servidor PHP

Execute no PowerShell:

```powershell
cd "f:\Projetos TVDoutor\TVDControl\php-app"
php -S localhost:8000 router.php
```

O servidor vai iniciar em: **http://localhost:8000**

### 4. Acessar a Aplicação

Abra no navegador: **http://localhost:8000**

Deve redirecionar automaticamente para `/login`

---

## 🧪 Roteiro de Testes

### Teste 1: Registro de Usuário

1. Acesse http://localhost:8000/login
2. Clique em "Não tem conta? Criar conta"
3. Preencha:
   - Nome: Seu Nome
   - Email: teste@example.com
   - Senha: 123456
   - Confirmar Senha: 123456
4. Clique em "Criar Conta"

**Resultado esperado:**
- ✅ Usuário criado no banco
- ✅ Redirecionado para `/dashboard`
- ✅ Token armazenado no localStorage

### Teste 2: Login

1. Faça logout (botão "Sair")
2. Use as credenciais do usuário criado
3. Clique em "Entrar"

**Resultado esperado:**
- ✅ Login bem-sucedido
- ✅ Redirecionado para dashboard

### Teste 3: Dashboard

Verifique:
- ✅ Nome do usuário aparece no header
- ✅ Cards de estatísticas carregam (Total, Em Uso, Disponíveis)
- ✅ Link "Inventário" está visível
- ✅ Link "Usuários" visível apenas se admin
- ✅ Botão "Sair" funciona

### Teste 4: API Direta (Opcional)

Teste os endpoints com curl ou Postman:

**Health Check:**
```bash
curl http://localhost:8000/api/health
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"teste@example.com\",\"password\":\"123456\"}"
```

**Listar Itens (com token):**
```bash
curl -X GET http://localhost:8000/api/items \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## ⚠️ Problemas Comuns

### Erro: "Database connection failed"

**Solução:**
1. Verifique se MySQL está rodando
2. Confirme credenciais no `config/.env`
3. Teste conexão: `mysql -u root -p`

### Erro: CSS não carrega

**Solução:**
```bash
cd "f:\Projetos TVDoutor\TVDControl"
npm run tailwind:build
```

### Erro: "Cannot find module"

**Solução:**
Certifique-se de estar rodando o servidor da pasta `php-app`:
```powershell
cd "f:\Projetos TVDoutor\TVDControl\php-app"
php -S localhost:8000 router.php
```

### Erro 404 nas rotas

**Solução:**
Use `router.php` ao iniciar o servidor:
```powershell
php -S localhost:8000 router.php
```

---

## 📋 Checklist de Funcionalidades

- [ ] Servidor PHP iniciado (porta 8000)
- [ ] Página de login carrega
- [ ] Registro de usuário funciona
- [ ] Login funciona
- [ ] Dashboard carrega com stats
- [ ] Logout funciona
- [ ] API retorna dados (teste via curl)

---

## 🔧 Comandos Úteis

**Iniciar servidor:**
```powershell
cd "f:\Projetos TVDoutor\TVDControl\php-app"
php localhost:8000 router.php
```

**Recompilar Tailwind:**
```powershell
cd "f:\Projetos TVDoutor\TVDControl"
npm run tailwind:build
```

**Ver logs do servidor:**
Os logs aparecem diretamente no terminal onde você iniciou o PHP server.

---

Pronto para testar! 🚀
