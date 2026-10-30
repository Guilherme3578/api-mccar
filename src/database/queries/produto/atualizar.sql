UPDATE produto
SET id_categoria = @id_categoria,
    codigo = @codigo,
    nome = @nome,
    marca = @marca,
    descricao = @descricao,
    preco_centavos = @preco_centavos,
    imagem_uri = @imagem_uri,
    garantia_meses = @garantia_meses,
    destaque = @destaque,
    ativo = @ativo,
    avaliacao_media = @avaliacao_media,
    avaliacao_quantidade = @avaliacao_quantidade,
    prazo_envio_horas = @prazo_envio_horas,
    frete_gratis_acima_centavos = @frete_gratis_acima_centavos
WHERE id_produto = @id_produto
RETURNING *;
