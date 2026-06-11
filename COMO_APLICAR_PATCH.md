# Como aplicar este patch no seu projeto ZapFatri

Este ZIP é um patch para adicionar o roteador rápido com Cloudflare Worker.

## 1. Copiar arquivos

Extraia este ZIP por cima da pasta do projeto:

```txt
C:\Users\paulo\Documents\CODIGOS\zapfatri-mvp
```

Aceite substituir os arquivos quando perguntar.

Arquivos que serão atualizados/adicionados:

```txt
server.js
.env.example
README.md
migrations/002_cloudflare_worker_rpc.sql
cloudflare-worker/src/worker.js
cloudflare-worker/wrangler.toml
cloudflare-worker/README.md
```

## 2. Rodar a nova migration no Supabase

No Supabase:

```txt
SQL Editor > New Query
```

Cole e rode:

```txt
migrations/002_cloudflare_worker_rpc.sql
```

## 3. Ajustar o Render/admin

No seu `.env` local e depois no Render:

```txt
PUBLIC_GO_BASE_URL=https://go.zapfatri.com
```

Depois reinicie:

```bash
npm run dev
```

## 4. Publicar o Worker

No Cloudflare Worker, cole o conteúdo:

```txt
cloudflare-worker/src/worker.js
```

Configure as variáveis/secrets:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
IP_HASH_SALT
ALLOW_NUMERIC_PHONE_WITHOUT_LOOKUP=true
```

## 5. Teste final

Depois de cadastrar o link no painel:

```txt
Slug: 5511930757733
Tipo: WhatsApp
Número: 5511930757733
```

Teste:

```txt
https://go.zapfatri.com/5511930757733?src=youtube&medium=descricao&video=teste-01
```

A pessoa deve ir direto para o WhatsApp, e o clique deve aparecer na aba Cliques.
