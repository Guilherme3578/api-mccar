CREATE TABLE IF NOT EXISTS usuario (
    id_usuario  INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    senha_hash  TEXT    NOT NULL,
    perfil      TEXT    NOT NULL DEFAULT 'CLIENTE' CHECK (perfil IN ('CLIENTE', 'ADMIN')),
    criado_em   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS endereco (
    id_endereco  INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario   INTEGER NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    logradouro   TEXT    NOT NULL,
    numero       TEXT    NOT NULL,
    complemento  TEXT,
    bairro       TEXT    NOT NULL,
    cidade       TEXT    NOT NULL,
    uf           TEXT    NOT NULL,
    cep          TEXT    NOT NULL,
    principal    INTEGER NOT NULL DEFAULT 0 CHECK (principal IN (0, 1))
);

CREATE TABLE IF NOT EXISTS cartao_salvo (
    id_cartao       INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario      INTEGER NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    apelido         TEXT,
    bandeira        TEXT    NOT NULL,
    ultimos_quatro  TEXT    NOT NULL,
    nome_titular    TEXT    NOT NULL,
    principal       INTEGER NOT NULL DEFAULT 0 CHECK (principal IN (0, 1))
);

CREATE TABLE IF NOT EXISTS modelo_veiculo (
    id_modelo_veiculo  INTEGER PRIMARY KEY AUTOINCREMENT,
    marca              TEXT    NOT NULL,
    modelo             TEXT    NOT NULL,
    ano                INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS veiculo (
    id_veiculo         INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario         INTEGER NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    id_modelo_veiculo  INTEGER NOT NULL REFERENCES modelo_veiculo (id_modelo_veiculo),
    principal          INTEGER NOT NULL DEFAULT 0 CHECK (principal IN (0, 1))
);

CREATE TABLE IF NOT EXISTS categoria (
    id_categoria  INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT    NOT NULL UNIQUE,
    icone         TEXT
);

CREATE TABLE IF NOT EXISTS produto (
    id_produto                   INTEGER PRIMARY KEY AUTOINCREMENT,
    id_categoria                 INTEGER NOT NULL REFERENCES categoria (id_categoria),
    codigo                       TEXT    NOT NULL UNIQUE,
    nome                         TEXT    NOT NULL,
    marca                        TEXT    NOT NULL,
    descricao                    TEXT    NOT NULL,
    preco_centavos               INTEGER NOT NULL CHECK (preco_centavos >= 0),
    imagem_uri                   TEXT,
    garantia_meses               INTEGER NOT NULL DEFAULT 0,
    destaque                     INTEGER NOT NULL DEFAULT 0 CHECK (destaque IN (0, 1)),
    ativo                        INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    avaliacao_media              REAL,
    avaliacao_quantidade         INTEGER NOT NULL DEFAULT 0,
    prazo_envio_horas            INTEGER NOT NULL DEFAULT 0,
    frete_gratis_acima_centavos  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS produto_veiculo (
    id_produto         INTEGER NOT NULL REFERENCES produto (id_produto) ON DELETE CASCADE,
    id_modelo_veiculo  INTEGER NOT NULL REFERENCES modelo_veiculo (id_modelo_veiculo) ON DELETE CASCADE,
    PRIMARY KEY (id_produto, id_modelo_veiculo)
);

CREATE TABLE IF NOT EXISTS especificacao_produto (
    id_produto  INTEGER NOT NULL REFERENCES produto (id_produto) ON DELETE CASCADE,
    nome        TEXT    NOT NULL,
    valor       TEXT    NOT NULL,
    PRIMARY KEY (id_produto, nome)
);

CREATE TABLE IF NOT EXISTS favorito (
    id_usuario  INTEGER NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    id_produto  INTEGER NOT NULL REFERENCES produto (id_produto) ON DELETE CASCADE,
    criado_em   TEXT    NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (id_usuario, id_produto)
);

CREATE TABLE IF NOT EXISTS carrinho (
    id_carrinho    INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario     INTEGER NOT NULL UNIQUE REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    atualizado_em  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS item_carrinho (
    id_carrinho  INTEGER NOT NULL REFERENCES carrinho (id_carrinho) ON DELETE CASCADE,
    id_produto   INTEGER NOT NULL REFERENCES produto (id_produto) ON DELETE CASCADE,
    quantidade   INTEGER NOT NULL CHECK (quantidade > 0),
    PRIMARY KEY (id_carrinho, id_produto)
);

CREATE TABLE IF NOT EXISTS cupom (
    id_cupom                INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo                  TEXT    NOT NULL UNIQUE,
    tipo                    TEXT    NOT NULL CHECK (tipo IN ('PERCENTUAL', 'VALOR')),
    valor                   INTEGER NOT NULL CHECK (valor > 0),
    minimo_compra_centavos  INTEGER NOT NULL DEFAULT 0,
    valido_ate              TEXT,
    ativo                   INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1))
);

CREATE TABLE IF NOT EXISTS pedido (
    id_pedido             INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario            INTEGER NOT NULL REFERENCES usuario (id_usuario),
    id_endereco           INTEGER NOT NULL REFERENCES endereco (id_endereco),
    id_cupom              INTEGER REFERENCES cupom (id_cupom) ON DELETE SET NULL,
    numero                TEXT    NOT NULL UNIQUE,
    criado_em             TEXT    NOT NULL DEFAULT (datetime('now')),
    status                TEXT    NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO', 'AGUARDANDO_PAGAMENTO', 'PAGO', 'ENVIADO', 'ENTREGUE', 'CANCELADO')),
    subtotal_centavos     INTEGER NOT NULL DEFAULT 0,
    frete_centavos        INTEGER NOT NULL DEFAULT 0,
    desconto_centavos     INTEGER NOT NULL DEFAULT 0,
    total_centavos        INTEGER NOT NULL DEFAULT 0,
    prazo_min_dias        INTEGER NOT NULL DEFAULT 0,
    prazo_max_dias        INTEGER NOT NULL DEFAULT 0,
    entrega_logradouro    TEXT    NOT NULL,
    entrega_numero        TEXT    NOT NULL,
    entrega_complemento   TEXT,
    entrega_bairro        TEXT    NOT NULL,
    entrega_cidade        TEXT    NOT NULL,
    entrega_uf            TEXT    NOT NULL,
    entrega_cep           TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS item_pedido (
    id_pedido                INTEGER NOT NULL REFERENCES pedido (id_pedido) ON DELETE CASCADE,
    id_produto               INTEGER NOT NULL REFERENCES produto (id_produto),
    nome_produto             TEXT    NOT NULL,
    codigo_produto           TEXT    NOT NULL,
    quantidade               INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario_centavos  INTEGER NOT NULL,
    PRIMARY KEY (id_pedido, id_produto)
);

CREATE TABLE IF NOT EXISTS pagamento (
    id_pagamento     INTEGER PRIMARY KEY AUTOINCREMENT,
    id_pedido        INTEGER NOT NULL UNIQUE REFERENCES pedido (id_pedido),
    id_usuario       INTEGER NOT NULL REFERENCES usuario (id_usuario),
    id_cartao        INTEGER REFERENCES cartao_salvo (id_cartao) ON DELETE SET NULL,
    metodo           TEXT    NOT NULL CHECK (metodo IN ('CARTAO', 'PIX', 'BOLETO')),
    status           TEXT    NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO', 'RECUSADO', 'ESTORNADO')),
    valor_centavos   INTEGER NOT NULL,
    cartao_bandeira  TEXT,
    cartao_final     TEXT,
    criado_em        TEXT    NOT NULL DEFAULT (datetime('now')),
    aprovado_em      TEXT
);
