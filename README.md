# ZapFatri MVP

MVP para rastrear cliques em links de WhatsApp e links comuns.

## O que esta versão faz

- Painel com login simples.
- Cadastro de links rastreáveis.
- Suporte a WhatsApp e links comuns.
- Registro de cliques no Supabase.
- Separação por link, origem, campanha, vídeo, medium e posição.
- Exportação CSV de cliques e relatório mensal.
- Redirecionamento automático para o destino final.

## Estrutura dos links

WhatsApp com número visível:

```txt
https://go.zapfatri.com/5511930757733
```

WhatsApp com origem/campanha/vídeo:

```txt
https://go.zapfatri.com/5511930757733?src=youtube&medium=descricao&video=aula-led-01&campaign=junho-2026
```

Link comum:

```txt
https://go.zapfatri.com/portfolio?src=instagram&pos=bio
```

## 1. Criar projeto no Supabase

1. Crie um projeto no Supabase.
2. Vá em **SQL Editor**.
3. Cole e rode o conteúdo de:

```txt
migrations/001_schema.sql
```

## 2. Configurar variáveis

Copie `.env.example` para `.env` no desenvolvimento local:

```bash
cp .env.example .env
```

Preencha:

```txt
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
APP_SECRET=
IP_HASH_SALT=
PUBLIC_GO_BASE_URL=
```

A chave `SUPABASE_SERVICE_ROLE_KEY` deve ficar só no backend/Render. Nunca coloque essa chave em frontend público.

## 3. Rodar local

```bash
npm install
npm run dev
```

Abra:

```txt
http://localhost:3000
```

## 4. Publicar no Render

Configuração sugerida no Render:

```txt
Runtime: Node
Build Command: npm install
Start Command: npm start
```

Environment variables no Render:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
APP_SECRET
IP_HASH_SALT
PUBLIC_GO_BASE_URL=https://go.zapfatri.com
NODE_ENV=production
```

## 5. Domínios recomendados

Para produção:

```txt
zapfatri.com      → institucional
app.zapfatri.com  → painel, em versão futura
go.zapfatri.com   → links rastreáveis
```

Neste MVP, o mesmo app pode responder tudo. O domínio principal que importa é:

```txt
go.zapfatri.com
```

## 6. Campos rastreados

A tabela `click_events` salva:

- data/hora
- link clicado
- origem
- medium
- campanha
- vídeo
- post
- posição
- referrer
- user agent
- IP em hash
- dispositivo aproximado
- navegador
- sistema operacional
- possível bot

Por padrão, o projeto **não salva IP puro**.

## 7. Próximas melhorias

- Tela de edição de links.
- Desativar/ativar link pelo painel.
- Gráficos.
- PDF mensal.
- QR Code por link.
- Multiusuário.
- Contas por cliente.
- Geolocalização por serviço externo com base legal/consentimento.


## Patch: clique público rápido com Cloudflare Worker

Para evitar demora quando o Render estiver dormindo, deixe:

```txt
app.zapfatri.com  -> painel/admin no Render
go.zapfatri.com   -> Cloudflare Worker para cliques públicos
```

O Worker registra o clique no Supabase em segundo plano e redireciona imediatamente para o WhatsApp ou para o destino cadastrado.

Arquivos adicionados por este patch:

```txt
cloudflare-worker/src/worker.js
cloudflare-worker/wrangler.toml
cloudflare-worker/README.md
migrations/002_cloudflare_worker_rpc.sql
```

Depois de aplicar este patch:

1. Rode `migrations/002_cloudflare_worker_rpc.sql` no SQL Editor do Supabase.
2. No `.env` do Render, use `PUBLIC_GO_BASE_URL=https://go.zapfatri.com`.
3. Publique o Worker no Cloudflare usando o arquivo `cloudflare-worker/src/worker.js`.
4. No Worker, configure os secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `IP_HASH_SALT`.

Para links numéricos de WhatsApp, exemplo:

```txt
https://go.zapfatri.com/5511930757733?src=youtube&medium=descricao&video=video-01
```

Esse tipo de link pode redirecionar sem esperar consulta ao banco, enquanto o registro do clique acontece em segundo plano.
