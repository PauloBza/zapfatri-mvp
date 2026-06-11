# Patch ZapFatri 007 - CSV Excel texto

Este patch corrige o CSV detalhado para o Excel não transformar telefone e slug numérico em notação científica.

Campos corrigidos no CSV detalhado:
- link_slug
- raw_slug
- telefone_whatsapp

Como aplicar:
1. Pare o servidor no VS Code com Ctrl + C.
2. Copie este server.js para a pasta do projeto:
   C:\Users\paulo\Documents\CODIGOS\zapfatri-mvp
3. Aceite substituir.
4. Rode novamente:
   npm run dev
5. Exporte de novo em:
   Cliques > CSV detalhado

Observação:
Abra um arquivo CSV novo exportado depois do patch. CSVs antigos continuarão com a conversão já feita pelo Excel.
