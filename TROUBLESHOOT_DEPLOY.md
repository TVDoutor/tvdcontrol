# Troubleshooting: Deploy Vercel

## Dashboard em branco / "Failed to fetch dynamically imported module"

1. **Hard refresh**: Ctrl+Shift+R (ou Cmd+Shift+R no Mac) para limpar cache
2. **Variável de ambiente**: Confirme que `VITE_API_BASE_URL=/api` está definida na Vercel (Settings → Environment Variables)
3. **Nova implantação**: Faça um redeploy para garantir que assets e index.html estejam sincronizados (evita 404 em chunks com hash antigo)

## 401 em /api/auth/refresh

O cookie de refresh usava `path: '/auth'`, mas o frontend chama `/api/auth/refresh`. O path do cookie foi corrigido para `/` para que seja enviado em todas as requisições da API. Se o erro persistir após o deploy:

- Faça logout e login novamente (para receber o novo cookie)
- Verifique se `JWT_SECRET` está configurado na Vercel

## 500 ao devolver item / GET /items/:id/history

Se o erro acontece ao clicar em "Devolver item", pode ser que as colunas `return_photo`, `return_notes`, `return_items` não existam em `inventory_history`. O backend agora tem fallback, mas para habilitar foto e observação na devolução, execute no phpMyAdmin **um comando de cada vez** (se der "Duplicate column", a coluna já existe — pule):

```sql
ALTER TABLE inventory_history ADD COLUMN return_photo TEXT NULL;
ALTER TABLE inventory_history ADD COLUMN return_notes TEXT NULL;
ALTER TABLE inventory_history ADD COLUMN return_items TEXT NULL;
```

*Nota: `ADD COLUMN IF NOT EXISTS` não existe em MySQL antigo (ex.: HostGator).*

## 500 no login (Vercel + MySQL HostGator)

Quando o login retorna **500 Internal Server Error** em produção:

## 1. Confira os logs da Vercel

1. Acesse [Vercel Dashboard](https://vercel.com) → seu projeto → **Logs**
2. Faça um novo login para gerar um novo log
3. Procure por mensagens `[auth/login] error:` – o texto após os dois pontos indica a causa real

## 2. Variáveis de ambiente na Vercel

Em **Settings → Environment Variables**, confira:

| Variável        | Descrição                                  |
|-----------------|--------------------------------------------|
| `DB_HOST`       | Host MySQL da HostGator (ex.: `mysqlXX.hostgator.com`) |
| `DB_PORT`       | Geralmente `3306`                          |
| `DB_USER`       | Usuário do banco                           |
| `DB_PASSWORD`   | Senha do banco                             |
| `DB_NAME`       | Nome do banco de dados                     |
| `JWT_SECRET`     | Obrigatório em produção                   |
| `CORS_ORIGIN`   | Opcional: domínios extras (separados por vírgula) |

## 3. MySQL remoto na HostGator

1. **cPanel → Remote MySQL**
2. Em **Access Hosts**:
   - Para testar: `%` (permite qualquer IP, menos seguro)
   - Ou informe o IP do servidor da Vercel, se disponível
3. Confirme o **host** MySQL (não `localhost`) – use o host remoto mostrado no cPanel.

## 4. SSL do banco (se exigido)

Se a HostGator exigir SSL para conexão remota:

- No Vercel, defina: `DB_SSL=true`

## 5. Timeout de conexão

Para conexões lentas ou cold start, ajuste o timeout (em ms):

- Exemplo: `DB_CONNECT_TIMEOUT=15000` (15 segundos)

## 6. Testar endpoint de health

Antes do login, teste se o backend responde e alcança o banco:

```text
GET https://tvdcontrol.vercel.app/api/health
```

- Resposta `{ "ok": true }` → banco acessível.
- Resposta 500 ou erro → falha na conexão com MySQL (host, credenciais, SSL ou firewall).
