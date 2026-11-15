# MCCAR · App mobile (React Native + Expo)

Front-end do MercadoCar, conectado à API Node.js da pasta `../src`.

## Como rodar

1. Suba a API (na raiz do projeto): `npm run setup` (primeira vez) e `npm run dev`.
   Ao iniciar, ela imprime o endereço da rede, por exemplo `http://192.168.1.127:3000`.
2. Dentro de `mobile/`:
   ```
   npm install
   cp .env.example .env     # edite com o IP impresso pela API
   npx expo start
   ```
3. Abra no celular com o Expo Go (PC e celular no mesmo Wi-Fi) ou no emulador.

Se o `.env` não existir, o app tenta usar o IP do computador que roda o Expo, na porta 3000.
No emulador Android, use `http://10.0.2.2:3000`.

## Estrutura

```
App.js                 sessão, navegação (pilha), carrinho, favoritos e veículo
config.js              endereço da API
services/              api.js (fetch + token JWT), auth, catalog, shop, account
screens/               login, register, home, catalog, detail, cart, checkout,
                       payment, confirmation, profile
components/            ui.js (componentes), auth-form.js, address-form.js
styles/theme.js        cores e estilos
utils/format.js        moeda (centavos → R$), datas, máscaras
```

## Fluxo de compra (igual ao guia da API)

login → catálogo → detalhe → carrinho (`GET /carrinhos/meu`) → checkout com cupom
(`?cupom=`) → `POST /pedidos/checkout` → `POST /pagamentos` → confirmação (`GET /pedidos/:id`).

## Observações

- Valores vêm em centavos; frete e prazo são sempre calculados pela API.
- O app nunca envia o número completo do cartão nem o CVV: só bandeira, 4 últimos dígitos e nome.
- Os produtos do seed não têm `imagem_uri`; o app mostra um ícone no lugar. Para usar fotos,
  preencha `imagem_uri` com uma URL pública (PUT `/produtos/:id`, como admin).
- Token JWT fica no AsyncStorage; se expirar (401), o app volta para o login.
- Cupom de boas-vindas: `BEMVINDO50` (50% na primeira compra).
