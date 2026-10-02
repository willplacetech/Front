# Trocar meu aparelho

O wizard público fica em `/troca`, com links na navegação e no hero do catálogo.

- Modelos e variantes vêm de `GET /api/produtos`, a mesma fonte usada pelo catálogo.
- Os quatro passos usam react-hook-form. A descrição é opcional; modelo, capacidade, cor, cinco fotos, IMEI e contato são obrigatórios.
- Fotos aceitas: JPEG, PNG e WebP, até 5 MB cada. O navegador verifica tamanho, tipo e assinatura antes do envio. A API repete a validação.
- O IMEI precisa de 15 dígitos e dígito verificador válido, conforme a API existente.
- `GET /api/auth/me` consulta nome, email e telefone pelo JWT verificado. Um token administrativo sem perfil de cliente retorna `user: null`; nesse caso, o contato é preenchido no passo final.
- `POST /api/troca` recebe multipart com `frontal`, `superior`, `inferior`, `lateralEsq` e `lateralDir`, além dos campos do aparelho e do contato. O protocolo corresponde ao ID persistido da solicitação. A tela de sucesso só aparece após a confirmação da API.
- Voltar ou corrigir um erro de envio preserva os dados e as fotos durante a navegação no wizard. Recarregar a página inicia um novo formulário.

## Configuração

O backend precisa de MongoDB e das variáveis `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` e `CLOUDINARY_API_SECRET`. Consulte `Back/.env.troca.example`. Mantenha essas credenciais no backend.

## Verificação

Na pasta `Front`:

```sh
npm install
npm run build
npm test
npx playwright install chromium
npm run test:troca
```

Os testes de navegador cobrem desktop e celular, com respostas da API simuladas. Na pasta `Back`, `npm test` verifica também as rotas de perfil e troca, com MongoDB e Cloudinary simulados; não envia fotos reais ao serviço externo.
