# Comparação e troca

`/comparar` usa o mesmo catálogo público e o componente `SeletorVariantes` da página de produto.

- Passos: `passo=aparelho`, `passo=loja`, `passo=comparativo`.
- `tradeInId` recupera uma solicitação com a identidade do cliente ou a chave de visitante guardada nesta sessão. A chave nunca vai na URL.
- Seleção manual: `meu` é o ID do modelo, `variante` é o ID da variante e `estado` é a descrição. O catálogo continua sendo a fonte das especificações.
- Cada parâmetro repetido `item=modeloId:variantId` identifica uma das duas opções da loja. URLs inválidas ou incompletas retornam ao primeiro passo necessário.
- A barra mede a proporção de diferenças entre capacidade, tela, chip, câmera, bateria e 5G com informações conhecidas nos dois aparelhos. Cor é destacada, mas não entra na barra. Dados ausentes não contam como diferença nem como ganho de desempenho.
- Ofertas aprovadas geram crédito. Sem oferta, o preço aparece sem desconto e a avaliação é indicada. O valor final nunca fica negativo.
- Selecionar um aparelho manualmente permite comparar antes do cadastro completo. Ao escolher a compra, `/troca` recebe os dados e preserva a comparação para o retorno após o envio.
- O carrinho usa `tradeInId` no pedido e o servidor confere acesso, status, preço e oferta. O crédito é aplicado uma vez ao total do pedido, limitado ao subtotal. Trocas rejeitadas ou concluídas não podem ser associadas a um novo pedido.
- Uma troca só pode ser associada a um pedido pendente, confirmado ou entregue. A validação e um índice único parcial no MongoDB impedem reutilização e requisições simultâneas. Cancelar o pedido libera a associação. Esvaziar o carrinho remove a associação local.

Verificação: `npm test`, `npm run build` e `npm run test:comparar` em `Front`; `npm test` em `Back`. Os testes de navegador simulam a API.
