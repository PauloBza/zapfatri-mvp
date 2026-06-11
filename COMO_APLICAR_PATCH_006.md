# Patch 006 - CSV limpo no Excel + Worker alinhado

Este patch ajusta o export CSV do ZapFatri para evitar que o Excel transforme telefone e slugs numéricos em notação científica, como `5,51E+12`.

## O que muda

- `telefone_whatsapp` exporta como texto no Excel.
- `link_slug` exporta como texto no Excel.
- `raw_slug` exporta como texto no Excel.
- O CSV continua separado por `;`.
- O arquivo `cloudflare-worker/src/worker.js` fica alinhado com a versão que grava via RPC no Supabase.

## Como aplicar

1. Pare o servidor local:

```powershell
Ctrl + C
```

2. Copie o arquivo `server.js` deste patch para a pasta do projeto:

```txt
C:\Users\paulo\Documents\CODIGOS\zapfatri-mvp
```

3. Aceite substituir.

4. Copie também:

```txt
cloudflare-worker\src\worker.js
```

para:

```txt
C:\Users\paulo\Documents\CODIGOS\zapfatri-mvp\cloudflare-worker\src\worker.js
```

5. Rode novamente:

```powershell
npm run dev
```

6. Abra o painel e exporte novamente o CSV detalhado.

## Resultado esperado no Excel

Antes:

```txt
5,51E+12
```

Depois:

```txt
5511930757733
```

## Observação

Não precisa rodar migration no Supabase para este patch.
