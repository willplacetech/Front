# Administração e acompanhamento de trocas

## Rotas

- `/loja/trocas`: listagem, filtro por status, pendentes em destaque, contador no menu e exportação CSV do filtro atual.
- `/loja/trocas/:id`: dados do aparelho e cliente, cinco fotos ampliáveis, histórico e ações de avaliação.
- `/troca/mid`: solicitações do cliente autenticado. Visitantes consultam o protocolo usando a chave guardada no navegador em que cadastraram a troca. A tela atualiza a cada 30 segundos enquanto está visível, ao retornar à janela e pelo botão de atualização.

A área administrativa valida a sessão em `GET /api/auth/admin` antes de exibir conteúdo. As rotas administrativas de troca usam o middleware existente `requireAdmin`. O acesso aos dados de clientes segue a identidade do JWT verificado ou a chave de acesso de visitante; o ID do protocolo, sozinho, não concede acesso.

## API e histórico

- `GET /api/troca/admin?status=pendente`: filtro administrativo opcional.
- `GET /api/troca/admin/:id`: detalhe administrativo.
- `GET /api/troca/admin/exportar?status=aprovado`: CSV UTF-8 com BOM, separador `;`, campos escapados e proteção contra fórmulas. Datas da exportação em UTC; telas usam America/Sao_Paulo.
- `PATCH /api/troca/:id/status`: aprovação exige `valorOferta` numérico não negativo; rejeição exige `motivoRejeicao` preenchido. Entrar em avaliação limpa a oferta anterior. Cada decisão acrescenta um evento ao histórico, com data e a oferta/motivo daquele momento.
- `GET /api/troca/mid`: somente as solicitações do cliente autenticado.

Solicitações antigas sem histórico mostram o cadastro e o último status conhecido. Etapas intermediárias não registradas não são inventadas.

## Render e recarga de rotas profundas

`public/_redirects` contém `/* /index.html 200` e é copiado para `dist` pelo Vite. Para Render Static Sites, o equivalente está em `render.yaml`, na seção `routes`: `type: rewrite`, `source: /*`, `destination: /index.html`.

O serviço Render precisa aplicar essa configuração. Se ele usa Blueprint, sincronize o `render.yaml`. Se foi criado manualmente, configure **Redirects/Rewrites** no painel com **Source** `/*`, **Destination** `/index.html` e **Action** `Rewrite`. Um novo build sozinho não aplica um Blueprint a um serviço criado manualmente. Referência: https://render.com/docs/redirects-rewrites.

O índice único parcial dos pedidos precisa estar criado no MongoDB para impedir duas associações simultâneas da mesma troca. Ele é declarado no schema do pedido e é criado pela inicialização padrão do Mongoose. O filtro por status usa `$in`, disponível em versões atuais do MongoDB. Referência: https://www.mongodb.com/docs/manual/core/index-partial/.

Depois da publicação, abrir diretamente ou atualizar `/loja/trocas`, `/loja/trocas/:id`, `/troca/mid` e `/comparar` deve devolver `index.html` com HTTP 200, preservando a URL. Assets existentes continuam sendo servidos normalmente.

## Verificação

Em `Front`: `npm test`, `npm run build`, `npm run test:troca`, `npm run test:comparar`, `npm run test:trocas-admin`. Em `Back`: `npm test`.

Os testes HTTP mantêm validações e middleware reais, com MongoDB/Cloudinary simulados. Os testes de navegador cobrem desktop e celular com API simulada.
