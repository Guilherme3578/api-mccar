# MCCAR · App mobile (React Native + Expo)

Front-end do MercadoCar, conectado à API Node.js (`api-mccar`). Layout seguindo o Figma
"MercadoCar — E-commerce (telas)".

## Como rodar

1. Suba a API (pasta `api-mccar`): `npm run setup` (primeira vez) e `npm run dev`.
   Ao iniciar, ela imprime o endereço da rede, por exemplo `http://192.168.1.127:3000`.
2. Dentro de `mobile/`:
   ```
   npm install
   cp .env.example .env     # edite com o IP impresso pela API
   npx expo start
   ```
3. Abra no celular com o Expo Go (PC e celular no mesmo Wi-Fi) ou no emulador.

Se o `.env` não existir, o app usa o IP do computador que roda o Expo, na porta 3000.

Para ver a área de administrador, promova um usuário na API com `npm run admin`.

## Telas

| Tela | O que faz |
|---|---|
| Login / Cadastro | Entrar e criar conta |
| Início | Busca, categorias, meu veículo, banners e destaques |
| Peças | Busca, filtro por categoria, ordenação e "compatível com meu veículo" |
| Favoritos | Coração da Início |
| Detalhes | Avaliação, compatibilidade, garantia, entrega, especificações e adicionar ao carrinho |
| Carrinho | Quantidade, remoção e resumo |
| Finalizar compra | Endereço, frete, forma de pagamento e cupom |
| Pagamento | **Mercado Pago (Checkout Pro)** ou pagamento no app (demonstração) |
| Confirmação | Pedido aprovado, pendente ou recusado |
| Perfil | Conta (alterar e excluir), veículos, endereços, cartões e pedidos |
| Gerenciar produtos (admin) | **CRUD completo**: inserir, consultar, alterar e excluir produtos |
| Fale conosco | WhatsApp, telefone, e-mail, mensagem e perguntas frequentes |

## Itens do roteiro atendidos no app

- **CRUD (2.1):** produtos (admin); endereços, veículos, cartões e conta do usuário.
- **Serviço externo, "ex. Correios" (2.1):** CEP preenche o endereço via `GET /cep/:cep` da API
  (ViaCEP), com consulta direta ao ViaCEP como reserva.
- **Gerar JSON (2.2):** Perfil → "Gerar JSON" (admin). Baixa `GET /relatorios/dados`, salva
  `mccar-dados-AAAAMMDDhhmmss.json` e abre o compartilhamento. É o arquivo que o dashboard lê.
- **Mercado Pago:** `POST /pagamentos/mercado-pago` → abre o `checkout_url` no navegador →
  `POST /pagamentos/mercado-pago/sincronizar` → confirmação.
- **Testes (2.6):** unitários, de integração e E2E (abaixo).

## Testes

```
npm test
```

| Tipo | Arquivos | O que cobre |
|---|---|---|
| Unitário | `__tests__/unit/` | Formatação e máscaras, validações de endereço e produto, regras do Mercado Pago, carregamento de todas as telas |
| Integração | `__tests__/integracao/` | Cliente da API (token, query, erros, 401), CEP, Gerar JSON, telas de Login, Cadastro, Endereço e Pagamento (React Native Testing Library) |
| E2E | `e2e/` | Fluxos reais no aparelho com [Maestro](https://maestro.dev) |

### E2E com Maestro

Pré-requisitos: API rodando com o seed, `npx expo start` rodando, emulador Android (ou celular via USB)
com o **Expo Go**, e o Maestro instalado (`curl -fsSL "https://get.maestro.mobile.dev" | bash`; no
Windows, use o WSL).

```
maestro test e2e \
  -e EXPO_URL=exp://192.168.1.127:8081 \
  -e CLIENTE_EMAIL=cliente@email.com -e CLIENTE_SENHA=123456 \
  -e ADMIN_EMAIL=admin@email.com -e ADMIN_SENHA=123456
```

| Fluxo | Cenário |
|---|---|
| `01-login` | Login inválido, login válido e logout |
| `02-compra-pix` | Busca, detalhe, carrinho, checkout (com cadastro de endereço por CEP) e pagamento |
| `03-endereco-crud` | Endereço: inserir com CEP, consultar, alterar e excluir |
| `04-admin-produto-crud` | Produto (admin): inserir, consultar, alterar e excluir |
| `05-gerar-json` | Botão "Gerar JSON" |

## Estrutura

```
index.js               ponto de entrada do Expo
App.js                 sessão, fontes Inter, navegação (pilha), carrinho, favoritos e veículos
config.js              endereço da API e dados de contato da loja
services/              api, auth, catalog, shop (pedidos e Mercado Pago), account, cep, export
screens/               uma tela por arquivo
components/            ui.js (componentes), auth-form.js, address-form.js
assets/produtos/       fotos dos produtos (nome = código, ex.: MC-001.jpg)
styles/theme.js        tokens do Figma (cores, fonte, raios) e estilos
utils/format.js        moeda (centavos → R$), datas, máscaras
__tests__/             testes unitários e de integração (Jest)
e2e/                   fluxos E2E (Maestro)
```

## Observações

- Valores vêm em centavos; frete, prazo e total são sempre calculados pela API.
- No pagamento no app, só vão para a API a bandeira, os 4 últimos dígitos e o nome. No Mercado Pago,
  os dados do cartão nem passam pelo app.
- Os dados de contato da loja ficam em `config.js` (`CONTATO`).
- Token JWT fica no AsyncStorage; se expirar (401), o app volta para o login.
- Cupom de boas-vindas: `BEMVINDO50` (50% na primeira compra).
