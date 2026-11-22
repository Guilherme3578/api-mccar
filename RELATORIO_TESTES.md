# Relatório Técnico de Testes — API MCCAR

**Projeto Integrador · SENAC 4º semestre · Desenvolvimento Mobile**
**Responsável pelo backend:** Guilherme Israel dos Santos
**Data da execução:** 07/11/2026 (testes com o Mercado Pago real: 22/11/2026)
**Ambiente:** Node.js 24.18.0 · Windows 11 · SQLite (better-sqlite3 13.0.3)

---

## 1. Resumo

| Indicador | Resultado |
|---|---|
| Testes de backend (unitários) | **110 testes, 110 aprovados** |
| Testes de API (integração HTTP) | **8 baterias com 375 verificações, todas aprovadas** |
| Falhas | **0** |
| Tempo total de execução | cerca de 3 segundos |
| Cobertura de linhas do código (`src/`) | **91,4%** |
| Cobertura de decisões (branches) | **91,7%** |
| Mercado Pago real (credencial de teste) | **Teste automático aprovado e compra de teste paga de ponta a ponta** |

Os testes são automatizados e reproduzíveis: qualquer pessoa da equipe roda tudo com um comando, sem servidor ligado, sem banco preparado e sem internet.

---

## 2. Os dois tipos de teste

| | Testes de backend (unitários) | Testes de API (integração) |
|---|---|---|
| **Pergunta que respondem** | "Cada regra do código funciona sozinha?" | "O sistema inteiro responde certo a quem usa a API?" |
| **Como funcionam** | Chamam as funções do código direto (validações, guards, services) | Sobem o servidor e enviam requisições HTTP reais, como o app em Expo faria |
| **Exemplo** | `freteService.calcular(...)` com R$ 100 em produtos deve devolver frete 0 | `GET /carrinhos/meu` com R$ 100 no carrinho deve devolver `frete_centavos: 0` |
| **Pasta** | `tests/unidade/` | `tests/api/` |
| **Comando** | `npm run test:unidade` | `npm run test:api` |
| **Cobertura sozinho** | 79,7% das linhas | 87,6% das linhas |

Os dois tipos se completam:
- O unitário testa casos difíceis de provocar por HTTP: token expirado, notificação falsa do Mercado Pago, arredondamento de centavos.
- O de API confirma que as peças funcionam juntas: rotas, guards, controllers, services e banco.

Somados, chegam a **91,4%** de cobertura.

---

## 3. Ferramentas e decisões

| Item | Escolha | Motivo |
|---|---|---|
| Executor de testes | `node:test` (embutido no Node.js) | Não precisa instalar Jest ou Mocha; menos dependências |
| Verificações | `node:assert` | Também embutido |
| Simulação (mock) | `mock` do `node:test` | Troca o Mercado Pago por uma versão falsa sem bibliotecas extras |
| Cobertura | `--experimental-test-coverage` do Node.js | Mede linhas, decisões e funções sem instalar nada |
| Banco nos testes | Um arquivo SQLite temporário por arquivo de teste | Cada teste começa do zero e não interfere nos outros |

### Isolamento
- O Node.js roda **cada arquivo de teste num processo separado**.
- **Banco:** cada arquivo cria o próprio banco temporário na pasta de arquivos temporários do sistema, e esse banco é apagado no fim.
- **Configuração:** os testes **não leem o `.env`**. A configuração (segredo do JWT, valores de frete, Mercado Pago) é fixada no começo do teste, então o resultado é o mesmo em qualquer máquina.
- **Servidor:** os testes de API sobem o servidor numa **porta livre escolhida pelo sistema**, e por isso não conflitam com uma API já rodando na porta 3000.
- **Rede:** o Mercado Pago é simulado, então os testes não dependem de internet nem de credencial.

### Estrutura
```
tests/
├── unidade/
│   ├── ambiente.js              configura o ambiente e monta cenários de compra direto pelos services
│   ├── validacao.test.js
│   ├── acesso.test.js
│   ├── calculos.test.js
│   ├── guards.test.js
│   ├── regras.test.js
│   └── mercadoPago.test.js
└── api/
    ├── apoio.js                 sobe o servidor, faz as requisições e acumula as falhas
    ├── crud.test.js
    ├── seguranca.test.js
    ├── regras.test.js
    ├── cupom.test.js
    ├── rotas.test.js
    ├── pagamentoAutomatico.test.js
    ├── telas.test.js
    └── mercadoPago.test.js
└── mercadopago/
    └── sandbox.test.js          Mercado Pago de verdade, com a credencial de teste (seção 8)
```

### Comandos
| Comando | O que roda |
|---|---|
| `npm test` | Todos os testes |
| `npm run test:unidade` | Só os testes de backend (unitários) |
| `npm run test:api` | Só os testes de API |
| `npm run test:cobertura` | Todos os testes, com o relatório de cobertura no final |
| `npm run test:mercadopago` | Teste com o Mercado Pago de verdade (seção 8) |

---

## 4. Testes de backend (unitários)

**110 testes em 30 grupos, todos aprovados (cerca de 1,7 s).**

| Arquivo | Parte do código | Testes | Resultado |
|---|---|---|---|
| `validacao.test.js` | `utils/validacao.js` | 29 | ✅ |
| `acesso.test.js` | `utils/acesso.js` | 6 | ✅ |
| `calculos.test.js` | `services/freteService.js` e cálculos do `cupomService.js` | 14 | ✅ |
| `guards.test.js` | `guards/` (autenticação, admin, limite de login, erros) | 19 | ✅ |
| `regras.test.js` | `usuarioService`, `pedidoService`, `pagamentoService`, `carrinhoService`, `carregarQueries` | 18 | ✅ |
| `mercadoPago.test.js` | `services/mercadoPagoService.js` e `integracoes/mercadoPago.js` | 24 | ✅ |
| **Total** | | **110** | ✅ |

### 4.1 Validação de dados (`validacao.test.js`)
| O que é verificado | Casos |
|---|---|
| Campos obrigatórios | Todos os campos que faltam aparecem numa mensagem só; corpo vazio não quebra |
| Proteção contra campos indevidos | O cliente não consegue enviar `id_usuario` ou `status` para campos que não pode alterar |
| Ids | Aceita `15` e `7`. **Recusa 11 formatos inválidos:** `abc`, `0`, `-1`, `1.5`, `1e1`, `0x10`, `01`, `" 1"`, vazio, `null` e `undefined` |
| Números inteiros | Respeita o mínimo; recusa decimais e vazio |
| Verdadeiro/falso | Entende `true`, `1`, `"1"` e `"true"`; o resto vira falso |
| Opções fixas (enums) | Aceita sem diferenciar maiúsculas; recusa valores fora da lista e mostra as opções válidas |

> O caso `0x10` vem de um bug real, encontrado e corrigido durante o projeto: `GET /produtos/0x10` devolvia o produto 16.

### 4.2 Permissões (`acesso.test.js`)
- O cliente acessa os próprios dados; os dados de outro cliente devolvem **403**.
- O admin acessa dados de qualquer usuário.
- No filtro `?id_usuario=`, o cliente sempre recebe só os próprios dados, mesmo que informe outro id.

### 4.3 Cálculos de dinheiro e prazo (`calculos.test.js`)
| Regra | Casos verificados |
|---|---|
| Frete | Pedido vazio: frete e prazo zerados. R$ 99,99: cobra R$ 29,90. **R$ 100,00 exatos: grátis.** Acima: grátis |
| Frete com cupom | O limite de R$ 100 considera o valor **depois** do desconto (R$ 150 − 50% = R$ 75: paga frete) |
| Prazo | Dias de envio + 2 a 7 de transporte; 25 horas de envio contam como 2 dias |
| Cupom percentual | 50% de R$ 150 = R$ 75; arredonda para baixo, a favor da loja (50% de R$ 129,95 = R$ 64,97) |
| Cupom de valor fixo | Desconta o valor em centavos |
| Limites do cupom | O desconto nunca passa do subtotal; abaixo da compra mínima não há desconto |
| Mensagem de compra mínima | Informa o código do cupom e o valor mínimo em reais |

### 4.4 Guards: segurança das rotas (`guards.test.js`)
| Guard | Casos verificados |
|---|---|
| `authGuard` (login) | Sem token: 401. Sem `Bearer`: 401. **Token assinado com outro segredo:** 401. **Token expirado:** 401. **Token com `alg: none`** (ataque conhecido): 401. **Token de usuário já excluído:** 401. Token válido carrega o usuário sem expor o `senha_hash` |
| `adminGuard` | Cliente e visitante: 403. Admin passa |
| `limiteLoginGuard` (força bruta) | 6ª tentativa após 5 erros: 429 com o header `Retry-After`. O bloqueio vale por e-mail e IP, sem afetar outras contas. E-mail com maiúsculas conta como o mesmo. Login certo zera a contagem. Erros de validação (400) não contam |
| `errorHandler` | Erro de negócio mantém status e mensagem. Erros do SQLite viram 409/400 com mensagem amigável. JSON malformado: 400. **Erro inesperado: 500 sem expor detalhes internos** |

### 4.5 Regras de negócio (`regras.test.js`)
| Área | Casos verificados |
|---|---|
| Cadastro | E-mail normalizado (`Bia@Teste.COM` → `bia@teste.com`), perfil `CLIENTE`, cupom de boas-vindas oferecido, senha nunca devolvida |
| Cadastro inválido | E-mail repetido: 409. Senha com menos de 6 caracteres: 400 |
| Login | Devolve um token JWT. **Senha errada e e-mail inexistente têm a mesma mensagem**, para não revelar quem tem cadastro |
| Checkout | **O pedido sai com exatamente os mesmos valores do resumo do carrinho** (subtotal, desconto, frete, total e prazos). Número no formato `MC-12345`. Carrinho esvaziado depois |
| Checkout inválido | Carrinho vazio: 400. Endereço de outro usuário: 403 |
| Status do pedido | Ninguém marca `PAGO` manualmente. Não pula etapas (de aguardando para entregue). Depois de pago, só o admin altera. Cancelar um pedido pago estorna o pagamento e mantém a data de aprovação no histórico |
| Status do pagamento | O valor é sempre o total do pedido. Aprovar marca o pedido como `PAGO`. Transições inválidas são recusadas. Depois de recusado, o cliente pode tentar de novo no mesmo registro |
| Dados de cartão | Guarda só a bandeira e os 4 últimos dígitos; **o número completo enviado por engano não é gravado** |
| Carregador de queries | Encontra a query pelo nome do arquivo `.sql`; um nome errado gera erro claro em vez de `undefined` |

### 4.6 Mercado Pago (`mercadoPago.test.js`)
A integração real com o Mercado Pago fica isolada em `src/integracoes/mercadoPago.js`. Nos testes, esse módulo é **substituído por uma versão falsa**: as funções de criar a cobrança e de buscar pagamentos passam a devolver dados controlados pelo teste. Assim, os testes cobrem todas as situações (aprovado, recusado, estornado, valor errado, notificação falsa) sem internet e sem credencial.

| Área | Casos verificados |
|---|---|
| Tradução de status | `approved` → APROVADO; `rejected`/`cancelled` → RECUSADO; `refunded`/`charged_back` → ESTORNADO; `pending`/`in_process`/`authorized` → PENDENTE |
| Tradução da forma de pagamento | Crédito e débito → CARTAO; PIX → PIX; boleto → BOLETO; saldo da conta → MERCADO_PAGO |
| Montagem da cobrança | Lista os produtos e o frete; **a soma dos itens enviados é igual ao total do pedido**; com cupom, junta os produtos num item com o desconto; usa as URLs configuradas para a notificação e o retorno ao app |
| Abrir checkout | Registra o pagamento pendente e devolve o link. Pode gerar outro link enquanto estiver pendente. Pedido de outro usuário: 403. Pedido já pago: 400. Pagamento simulado pendente bloqueia o Mercado Pago: 409 |
| Webhook (notificação) | Pagamento aprovado marca o pedido como `PAGO` e guarda o final do cartão. **Assinatura inválida: 401, sem alterar nada.** Notificação repetida não muda o resultado. Outros tipos e pagamentos inexistentes são ignorados |
| Proteções | **Pagamento aprovado com valor menor que o pedido não aprova.** Recusado e depois aprovado no mesmo checkout termina `PAGO`. **Notificação atrasada de uma tentativa recusada não desfaz uma aprovação.** Estorno no Mercado Pago cancela o pedido |
| Sincronizar | Consulta o Mercado Pago e atualiza o pedido; prefere a tentativa aprovada quando há várias; sem pagamento, continua pendente; pedido sem checkout: 404 |
| Sem credencial | Sem `MP_ACCESS_TOKEN`, a API responde 503 com uma mensagem explicando o que configurar |
| Consistência | O valor cobrado no Mercado Pago é igual ao total mostrado no resumo do carrinho |

A assinatura do webhook é gerada no teste com o mesmo algoritmo do Mercado Pago (HMAC-SHA256) e conferida pelo **validador oficial do SDK**, e não por uma imitação.

---

## 5. Testes de API (integração HTTP)

**8 baterias com 375 verificações, todas aprovadas (cerca de 2,5 s).**

Cada bateria sobe o servidor real, cria os próprios usuários e dados, e faz as requisições em sequência, como um usuário do app. Cada verificação confere o **status HTTP** e, quando importa, o **conteúdo da resposta**.

| Bateria | Arquivo | Verificações | Resultado |
|---|---|---|---|
| CRUDs de todas as entidades | `crud.test.js` | 58 | ✅ |
| Segurança e acesso (S1 a S5) | `seguranca.test.js` | 69 | ✅ |
| Regras de negócio (R1 a R6) | `regras.test.js` | 99 | ✅ |
| Cupom por usuário e boas-vindas | `cupom.test.js` | 28 | ✅ |
| Rotas sem conflito | `rotas.test.js` | 37 | ✅ |
| Aprovação automática do pagamento | `pagamentoAutomatico.test.js` | 18 | ✅ |
| Telas do Figma | `telas.test.js` | 50 | ✅ |
| Rotas do Mercado Pago | `mercadoPago.test.js` | 16 | ✅ |
| **Total** | | **375** | ✅ |

### 5.1 CRUDs (`crud.test.js`)
Percorre todas as entidades: cadastro e login, endereços, cartões, modelos de veículo, veículos do usuário, categorias, produtos com especificações e compatibilidade, favoritos, carrinho, pedido, itens do pedido e pagamento. Também verifica:
- **Duplicados:** e-mail repetido devolve 409, e vínculo produto–veículo repetido também.
- **Dados inválidos:** UF com 3 letras e cartão com final de 2 dígitos devolvem 400.
- **Senha:** nunca aparece nas respostas.
- **Histórico:** um pagamento aprovado não pode ser excluído.

### 5.2 Segurança (`seguranca.test.js`)
| Etapa | O que é verificado |
|---|---|
| S2: perfil de administrador | Cadastro sempre nasce `CLIENTE`, mesmo enviando `perfil: ADMIN`; rotas de admin bloqueadas para clientes |
| S1: dados de outro usuário | Endereços, cartões, pedidos e pagamentos de outro cliente devolvem 403; `id_usuario` enviado no corpo é ignorado; filtros não vazam dados |
| S1/S2: pedido e pagamento | Cliente não aprova o próprio pagamento; só o admin aprova |
| S3: tokens | Token de usuário excluído, token adulterado e token com `alg: none` são recusados |
| Promoção em tempo real | Ao virar admin, o mesmo token já ganha o acesso |
| S5: força bruta | 5 senhas erradas bloqueiam a 6ª tentativa, inclusive com a senha certa; outro e-mail continua liberado; e-mail inexistente responde igual a senha errada |

### 5.3 Regras de negócio (`regras.test.js`)
| Etapa | O que é verificado |
|---|---|
| R3: frete e prazo | Abaixo de R$ 100 cobra R$ 29,90; R$ 100 exatos é grátis; o frete enviado pelo app é ignorado |
| R4: cupom | Revalidado na finalização; mensagem de compra mínima |
| R1: status do pedido | Transições permitidas e proibidas; cancelamento recusa o pagamento pendente |
| R2: pagamento | Recusa, nova tentativa, aprovação, estorno; estorno proibido depois do envio |
| R5: checkout | Carrinho vira pedido numa transação; carrinho esvaziado |
| R6: principal e duplicados | O primeiro endereço vira principal; excluir o principal promove outro; veículo duplicado é bloqueado |

### 5.4 Cupons (`cupom.test.js`)
- **Boas-vindas:** o BEMVINDO50 é criado sozinho e devolvido no cadastro, e só vale na primeira compra.
- **Uso único:** um cupom comum vale uma vez por usuário, mas outro usuário pode usar o mesmo cupom.
- **Cancelamento:** cancelar o pedido devolve o cupom ao usuário.
- **Rascunhos:** com dois rascunhos usando o mesmo cupom, só o primeiro a ser finalizado leva o desconto.
- **Frete:** o limite de R$ 100 considera o valor já com o desconto.
- **Cupom desativado:** deixa de ser oferecido no cadastro.

### 5.5 Rotas (`rotas.test.js`)
| Etapa | O que é verificado |
|---|---|
| Rotas fixas e `/:id` | `/usuarios/me`, `/carrinhos/meu`, `/cupons/codigo/:codigo`, `/pedidos/checkout`, `/usuarios/:id/perfil` e `/usuarios/login` chegam ao endpoint certo |
| Rotas aninhadas | Especificações, veículos compatíveis, favoritos e itens do carrinho recebem o id da rota pai |
| Ids malformados | `abc`, `0`, `-1`, `1.5`, `1e1`, `0x10`, `%20` e `01` devolvem 400 |
| Rotas inexistentes | Rota e método não mapeados: 404. Barra no final e maiúsculas funcionam |
| Ordem dos guards | Rota protegida sem token devolve 401, e não 404 |
| Corpo inválido | JSON malformado: 400 |
| Datas | `criado_em` e `atualizado_em` no formato ISO 8601 (`2026-11-07T14:30:00Z`) e aceitos pelo `new Date()` do React Native |

### 5.6 Aprovação automática (`pagamentoAutomatico.test.js`)
- Com `PAGAMENTO_APROVACAO_AUTOMATICA=true`, PIX e cartão são aprovados na hora e o pedido fica `PAGO`.
- O boleto continua pendente.
- Pedido pago não pode ser cancelado pelo cliente e não pode ser pago duas vezes.

### 5.7 Telas do Figma (`telas.test.js`)
Cada etapa reproduz o que uma tela do Figma precisa:

| Tela | O que é verificado |
|---|---|
| 4 · Carrinho | Itens com a marca, quantidade, subtotal, frete estimado, prazo e total; frete grátis a partir de R$ 100 |
| 5 · Checkout | Cupom aplicado no resumo (inclusive em minúsculas); cupom inexistente, já usado ou sem mínimo recusado; **o pedido sai com os valores do resumo** |
| 6 · Pagamento | Cartão novo sem salvar guarda só bandeira e final; com `salvar_cartao`, o cartão aparece em "meus cartões" como principal |
| 7 e 9 · Pedidos | Número no formato `MC-30523`; pedidos do mais novo para o mais antigo |
| 2 · Listagem | Ordenação por menor preço, maior preço, avaliação e relevância; filtro, busca e ordenação juntos; ordenação inválida: 400 |

### 5.8 Rotas do Mercado Pago (`mercadoPago.test.js`)
- **Login:** abrir o checkout e sincronizar exigem login, e devolvem 401 sem ele.
- **Sem credencial:** sem `MP_ACCESS_TOKEN`, a API responde 503 com uma mensagem que explica o que configurar.
- **Validação:** sem `id_pedido`, devolve 400; pedido sem checkout do Mercado Pago, 404.
- **Webhook:** é público, sem login, e responde 200; notificações de outro tipo são ignoradas.
- **Conflito de rotas:** as rotas do Mercado Pago não conflitam com `/pagamentos/:id`.
- **Método:** `MERCADO_PAGO` não é aceito pelo pagamento simulado.

---

## 6. Os testes detectam erros de verdade?

Um teste só tem valor se falhar quando o código está errado. Para provar isso, **o código foi sabotado de propósito** e os testes foram rodados de novo. Depois, o código foi restaurado.

| Sabotagem no código | Resultado |
|---|---|
| Frete grátis "a partir de R$ 100" trocado por "acima de R$ 100" (`>=` por `>`) | ❌ Falharam os testes unitários "a partir de R$ 100 o frete é grátis" e "o desconto do cupom conta para o frete grátis" |
| Verificação do valor pago no Mercado Pago desligada | ❌ Falhou o teste "pagamento com valor menor que o pedido não aprova" |
| Validação de id passou a aceitar `0` e `01` | ❌ Falharam os testes "recusa 0" e "recusa 01" |
| Regra de frete alterada pelo `.env` (frete grátis só acima de R$ 9.999,99) | ❌ Baterias de API de regras e de cupom falharam, apontando a verificação exata |

Em todos os casos os testes acusaram o problema e indicaram a regra quebrada.

---

## 7. Cobertura de código

Medida com `npm run test:cobertura` sobre a pasta `src/`:

| Métrica | Unitários | API | **Todos juntos** |
|---|---|---|---|
| Linhas | 79,7% | 87,6% | **91,4%** |
| Decisões (branches) | 83,2% | 88,4% | **91,7%** |
| Funções | 62,8% | 80,8% | **83,0%** |

### Por camada
| Camada | Linhas cobertas | Observação |
|---|---|---|
| Rotas (`routes/`) | 100% | Todas as rotas são carregadas e exercitadas |
| Guards (`guards/`) | 92–100% | Só a limpeza periódica do limite de login (roda a cada 15 min) fica de fora |
| Utilitários (`utils/`) | 100% | |
| Enums e configuração | 86–100% | A parte não coberta é o aviso de banco antigo, testado manualmente |
| Services de regras críticas | 94–100% | `freteService` 100%, `pedidoService` 97,6%, `mercadoPagoService` 97,2%, `pagamentoService` 96,4%, `usuarioService` 95,4% |
| Repositories | 100% das linhas | |
| Services de cadastro simples | 70–95% | Categorias, modelos de veículo e veículos: alguns caminhos de editar e excluir não são exercitados |
| Controllers | 48–100% | Mesmo motivo: algumas rotas de editar e excluir de cadastros simples |
| `integracoes/mercadoPago.js` | 68% | As chamadas reais ao Mercado Pago são simuladas nos testes (ver seção 8) |

**Leitura:** as regras de dinheiro, segurança, status e pagamento estão acima de 94%. O que falta cobrir são operações simples de cadastro (editar e excluir categoria, modelo e veículo), que seguem o mesmo padrão já testado nas outras entidades.

---

## 8. Testes com o Mercado Pago de verdade

Além do Mercado Pago simulado das seções 4 e 5, existe um teste que fala com a **API real do Mercado Pago**, usando a credencial de teste: `tests/mercadopago/sandbox.test.js` (`npm run test:mercadopago`). Ele fica separado do `npm test` porque depende de internet e de credencial, e é **pulado** quando o `MP_ACCESS_TOKEN` não está no `.env`.

| Etapa | O que é verificado no Mercado Pago real |
|---|---|
| Pedido sem cupom | A API cria a cobrança; o link aponta para o Mercado Pago. A cobrança, lida de volta no Mercado Pago, está ligada ao pedido, tem os produtos com a quantidade, o frete como item, o comprador certo e **soma exatamente o total do pedido** |
| Antes de pagar | Sincronizar sem pagamento mantém o pedido aguardando. Gerar outro link cria uma nova cobrança no mesmo registro de pagamento |
| Pedido com cupom | O Mercado Pago cobra o total com desconto, igual ao resumo do carrinho |
| Webhook | Um pagamento inexistente é respondido pelo Mercado Pago como não encontrado, e a API ignora sem erro |
| Credencial inválida | O Mercado Pago recusa a chamada |

**Resultado em 22/11/2026:** ✅ `npm run test:mercadopago` **aprovado** com a credencial de teste da aplicação "Checkout Pro" da equipe. Todas as verificações acima passaram contra a API real do Mercado Pago.

### Compra de teste de ponta a ponta (22/11/2026)
Feita com a API rodando com o `.env` real, como o app faria:

| Passo | Resultado |
|---|---|
| Pedido `MC-45445` via checkout do carrinho | 1 pastilha de freio + 2 filtros de óleo; total **R$ 189,70**, frete grátis (acima de R$ 100) |
| `POST /pagamentos/mercado-pago` | Cobrança criada no Mercado Pago; pagamento `PENDENTE` / `MERCADO_PAGO` |
| Pagamento no checkout do Mercado Pago | Logado com um **comprador de teste**, cartão Mastercard de teste final 3311, titular `APRO`. Tela do Mercado Pago: "Você pagou R$ 189,70" |
| `POST /pagamentos/mercado-pago/sincronizar` | Pedido **`PAGO`**; pagamento **`APROVADO`**, método `CARTAO`, bandeira `MASTER`, final `3311`, valor R$ 189,70, data de aprovação e id do Mercado Pago (`189985827591`) registrados |
| Sincronizar de novo | Nada muda: pedido continua `PAGO` |
| Tentar pagar o mesmo pedido de novo | Bloqueado: `400 O pedido precisa estar com status AGUARDANDO_PAGAMENTO` |

**Lição registrada:** na primeira tentativa, abrindo o checkout sem login, o Mercado Pago mostrou "Uma das partes com as quais você está tentando efetuar o pagamento é de teste". Com credenciais de teste, **o pagamento precisa ser feito logado com uma conta de teste do tipo Comprador** (painel → Contas de teste → Criar nova conta), numa janela anônima. A API não precisou de nenhuma mudança.

## 9. Limitações e próximos passos

1. **Webhook com endereço público:** a chegada de uma notificação real do Mercado Pago só pode ser testada com a API num endereço público (como o ngrok). A lógica do webhook está coberta pelos testes unitários, incluindo a assinatura.
2. **Cadastros simples:** os caminhos de editar e excluir de categorias, modelos de veículo e veículos podem ganhar testes para elevar a cobertura das funções.
3. **Limite de login:** o bloqueio fica na memória do servidor e zera quando a API reinicia. Isso é aceitável para o projeto, mas não para vários servidores em produção.

---

## 10. Como reproduzir

```bash
npm install
npm test                  # todos os testes
npm run test:unidade      # só os de backend
npm run test:api          # só os de API
npm run test:cobertura    # todos, com a cobertura no final
npm run test:mercadopago  # Mercado Pago de verdade (precisa do MP_ACCESS_TOKEN de teste)
```

Não é preciso ligar o servidor, preparar o banco nem configurar o `.env`: os testes cuidam disso sozinhos e apagam o que criaram.
