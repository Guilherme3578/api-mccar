# API MCCAR

Backend do e-commerce de autopeças MCCAR, consumido pelo app em React Native com Expo.

**Stack:** Node.js 22+ · Express 5 · SQLite (better-sqlite3) · JWT

---

## Como rodar

Precisa do **Node.js 22 ou mais novo** (`node -v` para conferir). São só três comandos:

```bash
npm install
npm run setup
npm run dev
```

O `npm run setup` faz tudo sozinho:
1. Cria o `.env` a partir do `.env.example`, já com um `JWT_SECRET` gerado na hora.
2. Cria o banco em `data/mccar.db`.
3. Preenche o catálogo com 22 produtos, 7 categorias e 5 modelos de carro.

Pode rodar de novo quando quiser: ele não sobrescreve um `.env` que já existe e não duplica produtos.

> Não precisa instalar o Visual Studio nem nada para compilar. O `.npmrc` do projeto faz o `npm install` usar o SQLite já compilado que vem no pacote.

| Comando | O que faz |
|---|---|
| `npm run setup` | Primeira vez: cria o `.env` e preenche o banco |
| `npm run dev` | Sobe a API e recarrega ao salvar `.js` ou `.sql` |
| `npm start` | Sobe a API sem recarregar |
| `npm run seed` | Preenche só o catálogo de exemplo |
| `npm run admin -- email@exemplo.com` | Transforma um usuário já cadastrado em ADMIN |
| `npm test` | Roda os testes automatizados |

### Acessando pelo celular (Expo)

O celular **não** enxerga o `localhost` do computador. Ao subir, a API mostra o endereço da rede:

```
API MCCAR rodando em http://localhost:3000
Acesso pela rede (Expo): http://192.168.1.127:3000
```

Use esse IP no app, com o computador e o celular no mesmo Wi-Fi. Para testar a conexão: `GET /` responde `{ "api": "MCCAR", "status": "online" }`.

### Para recriar o banco do zero

Pare a API (Ctrl+C), apague a pasta `data/` e rode `npm run seed` de novo.

### Problemas comuns

| Erro | Solução |
|---|---|
| `JWT_SECRET não configurado` | Rode `npm run setup` |
| `Cannot find module ...` | Rode `npm install` |
| `EADDRINUSE` (porta em uso) | A API já está rodando em outro terminal, ou troque o `PORT` no `.env` |
| O celular não conecta | Use o IP da rede (não `localhost`), confira se estão no mesmo Wi-Fi e se o firewall do Windows liberou o Node |
| Datas antigas sem o `Z` no final | Banco criado antes de 01/11/2026: apague a pasta `data/` e rode `npm run seed` |

---

## Postman

Importe o arquivo [`postman/MCCAR.postman_collection.json`](postman/MCCAR.postman_collection.json).

1. Rode **Usuários > Cadastro** e **Usuários > Login**. O token fica salvo sozinho.
2. Siga as pastas na ordem: endereço, carrinho, checkout, pagamento. Os ids (`idEndereco`, `idCarrinho`, `idPedido`...) também são salvos sozinhos.
3. Para as rotas de admin, cadastre `admin@mccar.com`, rode `npm run admin -- admin@mccar.com` e use **Admin > Login admin**.

Para testar pelo celular, troque a variável `baseUrl` da collection pelo IP da rede.

---

## Autenticação

1. `POST /usuarios/login` com `{ "email", "senha" }` devolve `{ usuario, token }`.
2. Nas rotas protegidas, envie o header `Authorization: Bearer <token>`.
3. O token vale 1 dia. Quando a API devolver **401**, mande o usuário para o login.

| Nível | Pode |
|---|---|
| 🌐 Público | Cadastro, login e todo o catálogo (produtos, categorias, modelos de veículo) |
| 🔑 Cliente | Os próprios dados: perfil, endereços, cartões, veículos, favoritos, carrinho, pedidos e pagamentos |
| 👑 Admin | Tudo, mais gerenciar catálogo e cupons, aprovar pagamentos, avançar pedidos e promover usuários |

O campo `usuario.perfil` (`CLIENTE` ou `ADMIN`) do login serve para esconder as telas de admin no app.

**O dono dos dados vem sempre do token.** Não é preciso mandar `id_usuario` no corpo; se mandar, é ignorado.

---

## Fluxo de compra

```
1. POST /usuarios                    cadastro (devolve cupom_boas_vindas: "BEMVINDO50")
2. POST /usuarios/login              guardar o token
3. GET  /produtos?busca=filtro       catálogo, sem token
4. POST /enderecos                   endereço de entrega
5. GET  /carrinhos/meu                     tela do carrinho: itens, frete estimado e total
6. POST /carrinhos/:id/itens               { id_produto, quantidade }
7. GET  /carrinhos/meu?cupom=BEMVINDO50    tela de checkout: resumo com o desconto aplicado
8. POST /pedidos/checkout                  { id_endereco, id_cupom? }  → "Fazer pedido"
9. POST /pagamentos                        { id_pedido, metodo, ... }  → "Confirmar pagamento"
10. GET /pedidos/:id                       tela de confirmação e "Acompanhar pedido"
```

O checkout transforma o carrinho em pedido com **os mesmos valores** que o resumo mostrou, e esvazia o carrinho.

### Resumo do carrinho (telas de carrinho e checkout)
O `GET /carrinhos/meu` devolve tudo o que as telas mostram:

```json
{
  "id_carrinho": 2,
  "itens": [{ "id_produto": 6, "nome": "Pastilha de Freio Dianteira", "marca": "Bosch", "quantidade": 1, "preco_centavos": 12990, "total_centavos": 12990 }],
  "quantidade_itens": 1,
  "subtotal_centavos": 12990,
  "cupom": { "id_cupom": 1, "codigo": "BEMVINDO50", "tipo": "PERCENTUAL", "valor": 50 },
  "desconto_centavos": 6495,
  "frete_centavos": 2990,
  "prazo_min_dias": 3,
  "prazo_max_dias": 8,
  "total_centavos": 9485
}
```

- Sem `?cupom=`, o `cupom` vem `null` e o desconto, `0`.
- **"Aplicar código promocional":** chame com `?cupom=CODIGO`. Se o cupom não valer para o usuário (inexistente, expirado, já usado, mínimo não atingido), a resposta é **400 ou 404** com a mensagem pronta para exibir. Se valer, use o `cupom.id_cupom` no checkout.

### Pagamento com cartão (tela de pagamento)
O app **nunca** envia o número completo nem o CVV: só a bandeira, os 4 últimos dígitos e o titular.

```json
{ "id_pedido": 7, "metodo": "CARTAO", "salvar_cartao": true,
  "cartao": { "bandeira": "Visa", "ultimos_quatro": "1234", "nome_titular": "CARLOS ANDRADE" } }
```

- `salvar_cartao: true` guarda o cartão em `/cartoes` para as próximas compras. Com `false`, ou sem o campo, ele só fica registrado no pagamento.
- Para pagar com um cartão já salvo: `{ "id_pedido": 7, "metodo": "CARTAO", "id_cartao": 3 }`.
- PIX e boleto: `{ "id_pedido": 7, "metodo": "PIX" }`.

---

## Endpoints

### Usuários
| Método | Rota | Acesso | Observação |
|---|---|---|---|
| POST | `/usuarios` | 🌐 | `{ nome, email, senha }` (senha com 6+ caracteres) |
| POST | `/usuarios/login` | 🌐 | 5 erros seguidos bloqueiam por 15 min (429) |
| GET | `/usuarios/me` | 🔑 | Usuário logado |
| GET / PUT / DELETE | `/usuarios/:id` | 🔑 | O PUT aceita `nome`, `email` e `senha` |
| GET | `/usuarios` | 👑 | |
| PUT | `/usuarios/:id/perfil` | 👑 | `{ perfil: "ADMIN" \| "CLIENTE" }` |

### Catálogo (leitura 🌐, escrita 👑)
| Rota | Observação |
|---|---|
| `/categorias` | Cada categoria traz `icone`, com nomes do MaterialCommunityIcons |
| `/modelos-veiculo` | `{ marca, modelo, ano }` |
| `/produtos` | Filtros: `?busca=` (nome, marca ou código), `?id_categoria=`, `?id_modelo_veiculo=` ("compatível com meu veículo"), `?destaque=1`, `?ativo=`. Ordenação: `?ordenar=relevancia` (padrão), `menor_preco`, `maior_preco`, `avaliacao` ou `nome`. Os filtros podem ser combinados |
| `/produtos/:id` | Já traz `especificacoes` e `veiculos_compativeis` |
| `/produtos/:idProduto/especificacoes` | PUT e DELETE em `/:nome` |
| `/produtos/:idProduto/veiculos` | POST `{ id_modelo_veiculo }`, DELETE em `/:idModeloVeiculo` |

### Dados do usuário 🔑
Todas têm `GET`, `GET /:id`, `POST`, `PUT /:id` e `DELETE /:id`.

| Rota | Campos |
|---|---|
| `/enderecos` | `logradouro, numero, complemento?, bairro, cidade, uf, cep, principal?` |
| `/cartoes` | `bandeira, ultimos_quatro, nome_titular, apelido?, principal?` (nunca o número completo) |
| `/veiculos` | `id_modelo_veiculo, principal?` |

O primeiro cadastrado vira principal. Marcar outro como principal desmarca o anterior.

| Rota | Métodos |
|---|---|
| `/usuarios/:idUsuario/favoritos` | GET, POST `{ id_produto }`, DELETE `/:idProduto` |

### Carrinho 🔑
| Método | Rota | Observação |
|---|---|---|
| GET | `/carrinhos/meu` | **Use esta.** Traz itens, frete, prazo e total. `?cupom=CODIGO` aplica o desconto no resumo. O carrinho nasce junto com o usuário |
| GET / POST | `/carrinhos/:idCarrinho/itens` | POST `{ id_produto, quantidade }` |
| PUT / DELETE | `/carrinhos/:idCarrinho/itens/:idProduto` | PUT `{ quantidade }` |

### Pedidos 🔑
| Método | Rota | Observação |
|---|---|---|
| POST | `/pedidos/checkout` | **Fluxo principal.** `{ id_endereco, id_cupom? }` |
| GET | `/pedidos` | Filtro `?status=` |
| GET | `/pedidos/:id` | Traz `itens` e `pagamento` |
| PUT | `/pedidos/:id` | `{ status: "CANCELADO" }` para o cliente cancelar antes de pagar |
| POST / PUT / DELETE | `/pedidos`, `/pedidos/:idPedido/itens` | Fluxo manual de rascunho (opcional) |

### Pagamentos 🔑
| Método | Rota | Observação |
|---|---|---|
| POST | `/pagamentos` | `{ id_pedido, metodo }`. Em `CARTAO`: `id_cartao` (salvo) **ou** `cartao` + `salvar_cartao?` (novo) |
| GET | `/pagamentos`, `/pagamentos/:id` | |
| PUT | `/pagamentos/:id` | 👑 `{ status: "APROVADO" \| "RECUSADO" \| "ESTORNADO" }` |

### Cupons
| Método | Rota | Acesso |
|---|---|---|
| GET | `/cupons/codigo/:codigo` | 🔑 |
| CRUD | `/cupons` | 👑 |

---

## Regras que o app precisa saber

**Status do pedido**
```
AGUARDANDO_PAGAMENTO ──► PAGO ──► ENVIADO ──► ENTREGUE
         └──────────► CANCELADO ◄──┘
```
- `PAGO` acontece sozinho quando o pagamento é aprovado.
- O cliente só pode cancelar enquanto o pedido está `AGUARDANDO_PAGAMENTO`. Depois de pago, só o admin cancela ou avança o status.

**Pagamento**
- Com `PAGAMENTO_APROVACAO_AUTOMATICA=true` no `.env` (o padrão do `.env.example`), **PIX e cartão são aprovados na hora**: o `POST /pagamentos` já volta `APROVADO` e o pedido vira `PAGO`, como num gateway real.
- **Boleto** fica `PENDENTE` até um admin aprovar (`PUT /pagamentos/:id`), como a compensação de um boleto real.
- Com `false`, todo pagamento espera a aprovação do admin.

**Frete e prazo**
- O app **não** manda frete nem prazo: vêm calculados no pedido.
- Frete de R$ 29,90, **grátis a partir de R$ 100** em produtos (já com o desconto do cupom).
- Prazo em `prazo_min_dias` e `prazo_max_dias`.

**Cupons**
- Cada cupom vale **uma vez por usuário**. Cancelar o pedido devolve o cupom.
- `BEMVINDO50`: 50% de desconto na primeira compra. O cadastro devolve o código em `cupom_boas_vindas`, para o app mostrar.

---

## Convenções

**Dinheiro em centavos.** Todo campo `*_centavos` é inteiro. Para exibir, divida por 100:

```js
(produto.preco_centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
```

**Datas em ISO 8601 (UTC)**, como `2026-11-01T14:30:00Z`. Funcionam direto com `new Date(...)`.

**Booleanos** (`principal`, `destaque`, `ativo`) vêm como `0` ou `1`. Na hora de enviar, `true`/`false` também funcionam.

**Imagens:** `imagem_uri` vem `null`. As fotos dos produtos ficam no app (sugestão: mapear pelo `codigo`, que nunca muda).

**Número do pedido** no formato `MC-30523`, o mesmo do Figma.

**Valores do Figma** (frete R$ 24,90, grátis acima de R$ 299...) são de exemplo. Mostre sempre os valores que vêm da API.

**Status do pedido na tela:** a API manda o código; o app escolhe o texto. Sugestão: `AGUARDANDO_PAGAMENTO` → "Aguardando pagamento", `PAGO` → "Em processamento", `ENVIADO` → "Enviado", `ENTREGUE` → "Entregue", `CANCELADO` → "Cancelado".

**Erros** sempre no formato `{ "erro": "mensagem" }`, já em português e prontos para exibir:

| Status | Quando |
|---|---|
| 400 | Dado inválido ou regra violada |
| 401 | Sem token, token inválido ou expirado → voltar ao login |
| 403 | Sem permissão ou dado de outro usuário |
| 404 | Não encontrado |
| 409 | Registro duplicado ou em uso |
| 429 | Muitas tentativas de login → header `Retry-After` diz quantos segundos esperar |
| 500 | Erro inesperado |

---

## Estrutura

```
src/
  routes/        rotas por entidade
  guards/        autenticação, admin, limite de login e tratamento de erros
  controllers/   recebem a requisição e devolvem a resposta
  services/      regras de negócio
  repositories/  acesso ao banco
  database/      schema.sql, seed.sql e uma query .sql por arquivo
  enums/         status, métodos de pagamento, perfis
  config/        banco, ambiente, frete
tests/           testes automatizados (npm test)
postman/         collection para importar no Postman
```
