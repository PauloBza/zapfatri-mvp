# ZapFatri Cloudflare Worker

Este Worker é a parte rápida do ZapFatri.

## Objetivo

O painel/admin pode continuar no Render:

```txt
app.zapfatri.com
```

Mas os links públicos devem passar pelo Worker:

```txt
go.zapfatri.com
```

Assim o usuário não espera o Render acordar. Ele clica e vai direto para o WhatsApp.

## Arquivos

```txt
cloudflare-worker/src/worker.js
cloudflare-worker/wrangler.toml
```

## Variáveis/secrets necessários no Worker

Configure no Cloudflare Worker:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
IP_HASH_SALT
ALLOW_NUMERIC_PHONE_WITHOUT_LOOKUP=true
```

### Observação sobre velocidade

Com:

```txt
ALLOW_NUMERIC_PHONE_WITHOUT_LOOKUP=true
```

links numéricos como:

```txt
https://go.zapfatri.com/5511930757733
```

redirecionam imediatamente para:

```txt
https://wa.me/5511930757733
```

O clique é salvo em segundo plano.

Se quiser forçar o Worker a consultar o banco antes de redirecionar, use:

```txt
ALLOW_NUMERIC_PHONE_WITHOUT_LOOKUP=false
```

Isso é mais controlado, mas pode ser um pouco mais lento.

## Passo a passo rápido pelo painel da Cloudflare

1. Entre na Cloudflare.
2. Vá em Workers & Pages.
3. Crie um Worker.
4. Cole o conteúdo de `src/worker.js`.
5. Configure os secrets/variables.
6. Configure a rota/domínio `go.zapfatri.com/*`.

## Passo no Supabase

Antes de usar o Worker, rode no SQL Editor:

```txt
migrations/002_cloudflare_worker_rpc.sql
```

## No Render/admin

No `.env` do Render, ajuste:

```txt
PUBLIC_GO_BASE_URL=https://go.zapfatri.com
```

Assim o painel do ZapFatri vai gerar links usando o Worker.
