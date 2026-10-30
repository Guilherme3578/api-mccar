# API MCCAR — Relatório de Progresso

**Projeto Integrador · SENAC 4º semestre · Desenvolvimento Mobile**
**Responsável pelo backend:** Guilherme Israel dos Santos
**Última atualização:** 30/10/2026

---

## 1. Visão geral

API REST do e-commerce de autopeças **MCCAR**, consumida por um app em **React Native com Expo** (feito por outra parte da equipe). Este repositório contém **apenas o backend**.

| Item | Escolha |
|---|---|
| Linguagem | JavaScript (Node.js 24, CommonJS) |
| Framework | Express 5 |
| Banco de dados | SQLite (arquivo local), via `better-sqlite3` |
| Autenticação | JWT (`jsonwebtoken`) + senha com `bcryptjs` |
| Arquitetura | Routes → Guards → Controllers → Services → Repositories → SQL |
| Testes manuais | Postman |
| Visualização do banco | Extensão SQLite Viewer (VS Code) + `sqlite3` instalado no Windows |

### Princípios combinados
- **SQL separado do JavaScript:** toda query fica num arquivo `.sql` próprio. O JS nunca monta SQL.
- **Sem comentários no código.**
- **Middlewares chamados de `guards`** (pasta `src/guards`).
- **Estrutura de CRUD padrão:** service, controller e repository, com conexão direta ao banco e sem ORM.
- **Valores monetários sempre em centavos** (inteiros), por exemplo `15000` = R$ 150,00.

---

## 2. Estrutura de pastas

```
api-mccar/
├── .env                       configuração local (NÃO vai para o git)
├── .env.example               modelo do .env para a equipe
├── package.json
├── data/mccar.db              banco SQLite (criado automaticamente, fora do git)
└── src/
    ├── server.js              valida o .env e sobe o servidor (mostra o IP para o Expo)
    ├── app.js                 express, cors, json, rotas, 404 e tratamento de erros
    ├── config/
    │   ├── database.js        conexão SQLite, foreign keys, WAL, cria tabelas, transacao()
    │   ├── env.js             validação das variáveis obrigatórias na inicialização
    │   └── frete.js           valores de frete e prazo (lidos do .env)
    ├── database/
    │   ├── schema.sql         as 16 tabelas
    │   ├── carregarQueries.js lê a pasta da entidade e prepara cada .sql pelo nome
    │   └── queries/<entidade>/<operacao>.sql   97 arquivos de query
    ├── enums/                 Perfil, StatusPedido, StatusPagamento, MetodoPagamento, TipoCupom
    ├── guards/
    │   ├── authGuard.js       valida o JWT e carrega o usuário do banco
    │   ├── adminGuard.js      restringe a rota a administradores
    │   ├── limiteLoginGuard.js  bloqueia após 5 logins errados (15 min)
    │   └── errorHandler.js    converte erros em respostas JSON padronizadas
    ├── routes/                routes.js (agregador) + 1 arquivo por entidade
    ├── controllers/           16 controllers (só req/res)
    ├── services/              17 services (regras de negócio) + freteService
    ├── repositories/          16 repositories (só executam as queries)
    ├── scripts/promoverAdmin.js   transforma um usuário em ADMIN
    └── utils/
        ├── AppError.js        erro com status HTTP
        ├── validacao.js       exigirCampos, paraId, paraInteiro, paraFlag, paraOpcao...
        └── acesso.js          ehAdmin, garantirDono, idUsuarioDoFiltro
```

### Como uma requisição percorre o sistema
```
App (Expo) → Route → Guard (auth/admin) → Controller → Service (regras) → Repository → arquivo .sql → SQLite
                                               ↑                                    │
                                               └──────── JSON de resposta ◄──────────┘
Qualquer erro em qualquer camada → errorHandler → { "erro": "mensagem" } com o status certo
```

---

## 3. Banco de dados

**16 tabelas**, conforme o DER "pé de galinha" da equipe: usuario, endereco, cartao_salvo, veiculo, modelo_veiculo, produto_veiculo, favorito, produto, especificacao_produto, categoria, carrinho, item_carrinho, pedido, item_pedido, pagamento e cupom.

### Proteções no próprio banco
- `PRAGMA foreign_keys = ON` (o SQLite vem com elas desligadas).
- `CHECK` nos campos de status, flags (0/1), tipo de cupom, método de pagamento e quantidades maiores que 0.
- `UNIQUE` em e-mail, código de produto, nome de categoria, código de cupom, carrinho por usuário e pagamento por pedido.
- `ON DELETE CASCADE` nos dados pessoais (excluir o usuário apaga endereços, cartões, favoritos e carrinho).
- Os dados com histórico (pedidos, pagamentos) **não** são apagados em cascata: a exclusão é bloqueada.

### ⚠️ Mudança em relação ao DER original
| Tabela | Campo novo | Motivo |
|---|---|---|
| `usuario` | `perfil TEXT` (`CLIENTE` / `ADMIN`, padrão `CLIENTE`) | Controle de acesso de administrador (item S2) |

> **Ação:** atualizar o diagrama da equipe com esse campo.

### Tipos
`String` do DER vira `TEXT`, `Integer` vira `INTEGER` e `Float` vira `REAL`. As datas são `TEXT`, geradas pelo SQLite em UTC.

---

## 4. Como rodar

### Primeira vez
1. `npm install`
2. Copiar `.env.example` para `.env` e preencher o **`JWT_SECRET`**. Para gerar:
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
3. `npm run dev`. O banco é criado sozinho em `data/mccar.db`.
4. Cadastrar um usuário (`POST /usuarios`) e torná-lo admin:
   `npm run admin -- email@exemplo.com`

### Scripts
| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe com nodemon, recarregando ao mudar `.js` ou `.sql` |
| `npm start` | Sobe sem recarregar |
| `npm run admin -- <email>` | Promove o usuário a ADMIN |

### Variáveis do `.env`
| Variável | Obrigatória | Padrão | Uso |
|---|---|---|---|
| `PORT` | não | 3000 | Porta da API |
| `DB_PATH` | não | `data/mccar.db` | Caminho do arquivo do banco |
| `JWT_SECRET` | **sim**, com no mínimo 32 caracteres | — | Chave que assina os tokens |
| `JWT_EXPIRES_IN` | não | `1d` | Validade do token |
| `FRETE_PADRAO_CENTAVOS` | não | 2990 | Valor do frete |
| `FRETE_TRANSPORTE_MIN_DIAS` | não | 2 | Prazo mínimo de transporte |
| `FRETE_TRANSPORTE_MAX_DIAS` | não | 7 | Prazo máximo de transporte |

> Por que não tem usuário e senha do banco? O SQLite não é um servidor: é um arquivo. Basta o caminho (`DB_PATH`). Já o `JWT_SECRET` é a chave que assina os tokens de login. Quem conhece essa chave consegue se passar por qualquer usuário, por isso ela fica só no `.env`.

### Acesso pelo celular (Expo)
O celular **não** acessa o `localhost` do PC. Ao subir, a API imprime o endereço da rede:
```
API MCCAR rodando em http://localhost:3000
Acesso pela rede (Expo): http://192.168.1.127:3000
```
O app deve usar o endereço da rede, com o PC e o celular no mesmo Wi-Fi.

---

## 5. Autenticação e permissões

### Fluxo
1. `POST /usuarios/login` com `{ email, senha }`, que devolve `{ usuario, token }`.
2. Nas demais requisições, enviar o header `Authorization: Bearer <token>`.
3. A cada requisição, o `authGuard` valida a assinatura e **busca o usuário no banco**. Por isso, um usuário excluído perde o acesso na hora, e uma mudança de perfil vale imediatamente.

### Níveis de acesso
| Nível | Pode |
|---|---|
| **Público** (sem token) | Cadastro, login e todos os GET do catálogo (produtos, categorias, modelos de veículo, especificações, compatibilidade) |
| **Cliente** | Tudo que for **dele**: perfil, endereços, cartões, veículos, favoritos, carrinho, pedidos e pagamentos; consultar cupom pelo código |
| **Admin** | Tudo do cliente, mais: ver dados de qualquer usuário, gerenciar o catálogo e os cupons, aprovar, recusar ou estornar pagamentos, avançar o status dos pedidos e promover usuários |

### Regras de propriedade
- O dono do registro vem **sempre do token**. Um `id_usuario` enviado no corpo é ignorado.
- Acessar registro de outro usuário: **403**.
- Nos filtros `?id_usuario=`, quem não é admin recebe só os próprios dados.

---

## 6. Endpoints

**Legenda:** 🌐 público · 🔑 logado (dono do dado) · 👑 admin

### Usuários
| Método | Rota | Acesso | Observação |
|---|---|---|---|
| POST | `/usuarios` | 🌐 | Cadastro. Nasce `CLIENTE` e já ganha um carrinho |
| POST | `/usuarios/login` | 🌐 | Limite de 5 erros a cada 15 min |
| GET | `/usuarios/me` | 🔑 | Usuário logado |
| GET | `/usuarios` | 👑 | Lista todos |
| GET / PUT / DELETE | `/usuarios/:id` | 🔑 | Só o próprio (ou admin). O PUT aceita `nome`, `email` e `senha` |
| PUT | `/usuarios/:id/perfil` | 👑 | `{ perfil: "ADMIN" \| "CLIENTE" }`. Não altera o próprio perfil |

### Dados pessoais (CRUD completo: GET, GET /:id, POST, PUT /:id, DELETE /:id), 🔑
| Rota | Observação |
|---|---|
| `/enderecos` | O 1º cadastrado vira principal. Marcar um como principal desmarca os outros, e excluir o principal promove o mais antigo |
| `/cartoes` | Guarda só bandeira, últimos 4 dígitos e titular. Mesma regra de principal |
| `/veiculos` | Não permite repetir o mesmo modelo. Mesma regra de principal |
| `/usuarios/:idUsuario/favoritos` | GET, POST `{ id_produto }`, DELETE `/:idProduto` |

### Catálogo (GET 🌐 · escrita 👑)
| Rota | Observação |
|---|---|
| `/categorias` | Nome único |
| `/modelos-veiculo` | marca, modelo, ano |
| `/produtos` | Filtros: `?id_categoria=`, `?id_modelo_veiculo=`, `?destaque=`, `?ativo=`, `?busca=`. O GET `/:id` já traz especificações e veículos compatíveis |
| `/produtos/:idProduto/especificacoes` | PUT e DELETE em `/:nome` |
| `/produtos/:idProduto/veiculos` | POST `{ id_modelo_veiculo }`, DELETE `/:idModeloVeiculo` |

### Cupons
| Método | Rota | Acesso |
|---|---|---|
| GET | `/cupons/codigo/:codigo` | 🔑 (usado no checkout) |
| GET, POST, PUT, DELETE | `/cupons`, `/cupons/:id` | 👑 |

### Carrinho, 🔑
| Método | Rota | Observação |
|---|---|---|
| GET | `/carrinhos/meu` | **Rota principal para o app.** Traz os itens e o total |
| GET | `/carrinhos`, `/carrinhos/:id` | |
| POST / DELETE | `/carrinhos`, `/carrinhos/:id` | Normalmente desnecessários, porque o carrinho nasce com o usuário |
| GET, POST | `/carrinhos/:idCarrinho/itens` | POST `{ id_produto, quantidade }` |
| PUT, DELETE | `/carrinhos/:idCarrinho/itens/:idProduto` | PUT `{ quantidade }` |

### Pedidos, 🔑
| Método | Rota | Observação |
|---|---|---|
| POST | `/pedidos/checkout` | **Fluxo principal.** `{ id_endereco, id_cupom? }` cria o pedido a partir do carrinho, já em `AGUARDANDO_PAGAMENTO`, e esvazia o carrinho |
| POST | `/pedidos` | Cria um pedido em `RASCUNHO` (fluxo manual) |
| GET | `/pedidos`, `/pedidos/:id` | Filtro `?status=`. O detalhe traz os itens e o pagamento |
| PUT | `/pedidos/:id` | Em rascunho: `id_endereco`, `id_cupom`, `status`. Depois disso, só `status` |
| DELETE | `/pedidos/:id` | Só em `RASCUNHO` |
| GET, POST, PUT, DELETE | `/pedidos/:idPedido/itens[/:idProduto]` | Só em `RASCUNHO` |

### Pagamentos
| Método | Rota | Acesso | Observação |
|---|---|---|---|
| POST | `/pagamentos` | 🔑 | `{ id_pedido, metodo: CARTAO\|PIX\|BOLETO, id_cartao? }`. Se o anterior foi recusado, reabre a tentativa |
| GET | `/pagamentos`, `/pagamentos/:id` | 🔑 | |
| PUT | `/pagamentos/:id` | 👑 | `{ status }` |
| DELETE | `/pagamentos/:id` | 👑 | Só `PENDENTE` ou `RECUSADO` |

### Utilitária
`GET /` devolve `{ api: "MCCAR", status: "online" }`, que serve para o front testar a conexão.

---

## 7. Regras de negócio

### 7.1 Status do pedido
```
RASCUNHO ──────────► AGUARDANDO_PAGAMENTO ──► PAGO ──► ENVIADO ──► ENTREGUE
    │                        │                  │
    └──────► CANCELADO ◄─────┴──────────────────┘
```
- `PAGO` **nunca** é definido manualmente: acontece só quando o pagamento é aprovado.
- O cliente altera o status apenas em `RASCUNHO` ou `AGUARDANDO_PAGAMENTO` (finalizar ou cancelar). Dali em diante, só o admin.
- Para sair de `RASCUNHO`, o pedido precisa de pelo menos 1 item e o cupom precisa estar válido e com o mínimo atingido.
- Cancelar o pedido faz o pagamento `PENDENTE` virar `RECUSADO` e o `APROVADO` virar `ESTORNADO`.
- Depois de sair do rascunho, **os totais congelam**.

### 7.2 Status do pagamento
```
PENDENTE ──► APROVADO ──► ESTORNADO
    └──────► RECUSADO
```
- `APROVADO` marca o pedido como `PAGO`, mas só se ele estiver aguardando pagamento.
- `ESTORNADO` cancela o pedido, mas só antes do envio. O `aprovado_em` é mantido no histórico.
- `RECUSADO`: o cliente pode fazer um novo `POST /pagamentos`, que reaproveita o registro, porque o DER exige 1 pagamento por pedido.
- O valor do pagamento é sempre o total do pedido, nunca um valor enviado pelo app.

### 7.3 Frete e prazo (calculados no backend)
- **Frete:** R$ 29,90. É **grátis** quando **todos** os itens oferecem frete grátis (`frete_gratis_acima_centavos > 0`) **e** o subtotal atinge o **maior** limite entre eles.
- **Prazo:** dias de envio (o maior `prazo_envio_horas` dos itens, convertido em dias) somados a 2 a 7 dias de transporte.
- O app **não** define o frete. Se mandar o campo, ele é ignorado.

### 7.4 Cupom
- Tipos `PERCENTUAL` (de 1 a 100) ou `VALOR` (em centavos). O desconto nunca passa do subtotal.
- É validado ao ser vinculado e **revalidado na finalização** (ativo, dentro da validade, mínimo de compra atingido).

### 7.5 Snapshot (cópia dos dados no momento da compra)
- O pedido copia o **endereço** para os campos `entrega_*`, então mudar o endereço depois não altera o pedido.
- O item do pedido copia o **nome, o código e o preço** do produto.
- O pagamento copia a **bandeira e o final** do cartão.

### 7.6 Segurança
- Senhas com bcrypt. O `senha_hash` nunca aparece nas respostas.
- O login responde igual para e-mail inexistente e para senha errada, para não revelar quem tem cadastro.
- Token assinado com `HS256` fixo, o que bloqueia o ataque com `alg: none`.
- Após 5 logins errados para o mesmo e-mail e IP, bloqueio de 15 minutos (resposta 429 com header `Retry-After`).
- A API não sobe sem um `JWT_SECRET` válido.

---

## 8. Padrão de respostas

| Situação | Status | Corpo |
|---|---|---|
| Sucesso (consulta/alteração) | 200 | O registro ou a lista |
| Criado | 201 | O registro criado |
| Excluído | 204 | Vazio |
| Dados inválidos / regra violada | 400 | `{ "erro": "mensagem" }` |
| Sem token / token inválido | 401 | `{ "erro": ... }` |
| Sem permissão / dado de outro usuário | 403 | `{ "erro": ... }` |
| Não encontrado | 404 | `{ "erro": ... }` |
| Duplicado / registro em uso | 409 | `{ "erro": ... }` |
| Muitas tentativas de login | 429 | `{ "erro": ... }` |
| Erro inesperado | 500 | `{ "erro": "Erro interno do servidor" }` (detalhe só no terminal) |

---

## 9. Histórico do trabalho

### Fase 1: estrutura base
- Montagem da arquitetura em camadas, das 16 tabelas e dos CRUDs de todas as entidades.
- Queries em arquivos `.sql` separados, com um carregador automático pelo nome do arquivo.
- Tratamento centralizado de erros, incluindo a conversão dos erros do SQLite (UNIQUE, FK, CHECK).
- Servidor acessível pela rede para o Expo, CORS liberado e login com JWT.
- Renomeação de `middlewares` para `guards`, a pedido.
- Instalação do `sqlite3` no Windows, para a extensão de visualização.

### Fase 2: análise técnica
Levantamento de **32 pontos de melhoria** em 6 tópicos (segurança, regras de negócio, qualidade, banco, contrato com o front, operação), classificados por gravidade.

### Fase 3: tópico 1, segurança e acesso ✅
| Item | Entrega |
|---|---|
| S1 | Cada usuário só acessa os próprios dados, e o dono vem do token |
| S2 | Perfil ADMIN, `adminGuard`, script `npm run admin` |
| S3 | O guard confere se o usuário ainda existe; algoritmo HS256 fixo |
| S4 | Validação do `.env` na inicialização |
| S5 | Limite de tentativas de login e resposta igual para e-mail inexistente |

### Fase 4: tópico 2, regras de negócio ✅
| Item | Entrega |
|---|---|
| R1 | Transições definidas para o status do pedido |
| R2 | Transições do pagamento sincronizadas com o pedido; estorno preserva o histórico |
| R3 | Frete e prazo calculados no backend (`freteService`) |
| R4 | Cupom revalidado na finalização, com mensagem de mínimo não atingido (limite por usuário pendente) |
| R5 | `POST /pedidos/checkout` numa transação só |
| R6 | Promoção automática do principal, carrinho criado no cadastro, `GET /carrinhos/meu`, veículo duplicado bloqueado, avaliação não editável, nova tentativa de pagamento |
| Q1 (adiantado) | Enums para todos os status, métodos, tipos e perfil. Nenhuma string de status solta no código |

### Testes executados
Três baterias automatizadas, feitas fora do repositório e rodadas contra bancos temporários:

| Bateria | Verificações | Resultado |
|---|---|---|
| Fluxo completo (cadastro até pagamento) | 57 | ✅ todas passando |
| Segurança (acesso indevido, tokens forjados, força bruta) | 73 | ✅ todas passando |
| Regras de negócio (status, frete, cupom, checkout) | 109 | ✅ todas passando |
| **Total** | **239** | ✅ |

---

## 10. Guia rápido para o time do front (Expo)

**Fluxo de compra:**
```
1. POST /usuarios/login                → guardar o token
2. GET  /produtos?busca=pastilha       → catálogo (sem token)
3. GET  /carrinhos/meu                 → pegar o id_carrinho
4. POST /carrinhos/:id/itens           → { id_produto, quantidade }
5. POST /pedidos/checkout              → { id_endereco, id_cupom? }
6. POST /pagamentos                    → { id_pedido, metodo, id_cartao? }
7. GET  /pedidos/:id                   → acompanhar o status
```

**Cuidados:**
- Usar o IP da rede, nunca `localhost`, no celular.
- Não enviar `id_usuario` no corpo, porque o backend usa o do token.
- Não enviar frete nem prazo, porque vêm calculados.
- Valores em **centavos**: dividir por 100 para exibir.
- O campo `perfil` do login pode ser usado para esconder as telas de admin.
- Tratar o 401 (mandar para o login), o 403 (sem permissão) e o 429 (aguardar).
- As datas vêm em UTC no formato `AAAA-MM-DD HH:MM:SS`. Ver o item B1 do backlog antes de usar `new Date()`.

---

## 11. Backlog

### Tópico 3: qualidade do código
| Item | Descrição | Status |
|---|---|---|
| Q1 | ENUMs | ✅ feito |
| Q2 | Camada `validators/` por entidade, devolvendo todos os erros de uma vez | ⏳ |
| Q3 | Validações mais rígidas (rejeitar boolean inválido, limites de tamanho de texto) | ⏳ |
| Q4 | Helper para a lógica de "principal" repetida 3 vezes | ⏳ |
| Q5 | `carregarQueries` acusando o nome de query inexistente | ⏳ |
| Q6 | Centralizar as mensagens e os status HTTP (opcional) | ⏳ |

### Tópico 4: banco de dados
| Item | Descrição | Status |
|---|---|---|
| B1 | 🔴 Datas em ISO 8601 com fuso (`2026-10-30T02:51:56Z`). O formato atual pode virar `Invalid Date` no React Native (Hermes) | ⏳ prioritário |
| B2 | Migrations versionadas (`001_inicial.sql`...) para mudar o schema sem apagar o banco | ⏳ recomendado antes de novas mudanças no DER |
| B3 | Índices nas chaves estrangeiras | ⏳ |
| B4 | Inativar em vez de excluir (muda o DER) | ⏳ precisa de acordo |
| B5 | Busca sem acento (muda o DER) | ⏳ precisa de acordo |

### Tópico 5: contrato com o front
| Item | Descrição | Status |
|---|---|---|
| A1 | Paginação (`?pagina=&limite=`) | ⏳ |
| A2 | PUT parcial vira PATCH, ou fica documentado | ⏳ |
| A3 | Collection do Postman e README | ⏳ |
| A4 | Erros indicando o campo (`{ erro, campos }`) | ⏳ |

### Tópico 6: projeto e operação
| Item | Descrição | Status |
|---|---|---|
| O1 | `seed.sql` com dados de exemplo para o front | ⏳ |
| O2 | Testes automatizados no repositório (`npm test` com `node:test`) | ⏳ |
| O3 | Remover dependências instaladas por engano (`init`, `npm`), log de requisições, encerramento limpo do banco | ⏳ |

---

## 12. Decisões pendentes (alinhar com a equipe)

1. **Cupom: uso limitado a 1 vez por usuário?** A sugestão é sim.
2. **A regra de frete grátis da seção 7.3 serve para a equipe?**
3. **Atualizar o DER** com o campo `usuario.perfil`.
4. **B4 (inativar em vez de excluir) e B5 (busca sem acento)** mudam o DER. Aprovar ou não.
5. **Próximo passo sugerido:** B1 (datas, que afetam o front diretamente), depois B2, O1 e A3.

---

## 13. Pontos de atenção

- ⚠️ **Nada foi commitado ainda.** Fazer o primeiro commit antes de continuar.
- ⚠️ O **`JWT_SECRET` do `.env` local está vazio**, e a API não sobe assim. Gerar um segredo (seção 4).
- O arquivo `src/routes/index.js` foi renomeado para `routes.js`, e o `app.js` já foi ajustado.
- O bloqueio de login fica na memória e zera quando o servidor reinicia.
- Trocar a senha não derruba sessões já abertas (o token vale até expirar).
- O preço do item adicionado manualmente a um pedido em rascunho fica fixo desde a inclusão. O checkout não tem esse problema.
