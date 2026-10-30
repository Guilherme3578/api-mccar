INSERT INTO produto (
    id_categoria, codigo, nome, marca, descricao, preco_centavos, imagem_uri, garantia_meses,
    destaque, ativo, avaliacao_media, avaliacao_quantidade, prazo_envio_horas, frete_gratis_acima_centavos
)
VALUES (
    @id_categoria, @codigo, @nome, @marca, @descricao, @preco_centavos, @imagem_uri, @garantia_meses,
    @destaque, @ativo, @avaliacao_media, @avaliacao_quantidade, @prazo_envio_horas, @frete_gratis_acima_centavos
)
RETURNING *;
