# ZapFatri Patch 003 - Relatórios e exportação limpa

Este patch ajusta:

- Aba Cliques mostrando mais colunas
- Tabela com scroll horizontal para não cortar
- CSV detalhado com dados separados por coluna
- Relatório semanal
- Relatório mensal com país/estado/cidade/dispositivo
- Campos extras de localização para Cloudflare Worker

## Como aplicar

1. Pare o servidor local no VS Code:

```powershell
Ctrl + C
```

2. Copie os arquivos deste patch para dentro da pasta atual do projeto:

```txt
C:\Users\paulo\Documents\CODIGOS\zapfatri-mvp
```

3. Aceite substituir `server.js`.

4. No Supabase, abra:

```txt
migrations/003_reports_exports.sql
```

Copie tudo e rode no SQL Editor.

5. Reinicie o servidor:

```powershell
npm run dev
```

## Onde testar

Aba cliques:

```txt
http://localhost:3000/admin/clicks
```

Relatório semanal:

```txt
http://localhost:3000/admin/reports/weekly
```

Relatório mensal:

```txt
http://localhost:3000/admin/reports/monthly
```

## Importante

Localização real completa só aparece quando o clique passar por `go.zapfatri.com` no Cloudflare Worker. Em `localhost`, normalmente cidade/país ficam vazios.
