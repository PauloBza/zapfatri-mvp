# Patch ZapFatri - edição de links

Este patch adiciona edição de links no painel.

## O que muda

- Botão "Editar" na listagem de Links
- Botão "Editar link" na página de detalhes do link
- Tela para editar:
  - nome
  - tipo
  - slug
  - telefone
  - mensagem padrão
  - URL de destino
  - cliente
  - campanha
  - origem padrão
  - status ativo/inativo
- Mantém os cliques antigos no banco

## Como aplicar

1. Pare o servidor no VS Code com Ctrl+C.
2. Copie o arquivo `server.js` desta pasta para a pasta do projeto:
   `C:\Users\paulo\Documents\CODIGOS\zapfatri-mvp`
3. Aceite substituir.
4. Rode:
   `npm run dev`
5. Abra:
   `http://localhost:3000/admin/links`
6. Clique em `Editar`.

## Ajuste recomendado

Edite o link FATRI 7733 e troque o slug:

De:
`55-11-93075-7733`

Para:
`5511930757733`

Assim o link público fica:
`https://zapfatri-go.paulobza.workers.dev/5511930757733`
