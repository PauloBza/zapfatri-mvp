# ZapFatri - Patch 004: data e hora nos relatórios

Este patch adiciona nos relatórios semanal e mensal:

- primeiro_clique_iso
- primeiro_clique_data
- primeiro_clique_hora
- ultimo_clique_iso
- ultimo_clique_data
- ultimo_clique_hora

Importante: relatório semanal/mensal é agrupado. Portanto ele não mostra a data/hora de cada clique individual.
Ele mostra o primeiro e o último clique dentro de cada grupo. Para ver cada clique com data/hora exata,
use Cliques > CSV detalhado.

## Como aplicar

1. Pare o servidor com Ctrl+C.
2. Copie server.js para a raiz do projeto zapfatri-mvp.
3. Rode no Supabase o arquivo migrations/004_report_datetime.sql.
4. Reinicie com npm run dev.
5. Exporte novamente o CSV mensal/semanal.
