INSERT INTO pedido (
    id_usuario, id_endereco, id_cupom, numero, frete_centavos, prazo_min_dias, prazo_max_dias,
    entrega_logradouro, entrega_numero, entrega_complemento, entrega_bairro, entrega_cidade, entrega_uf, entrega_cep
)
VALUES (
    @id_usuario, @id_endereco, @id_cupom, @numero, @frete_centavos, @prazo_min_dias, @prazo_max_dias,
    @entrega_logradouro, @entrega_numero, @entrega_complemento, @entrega_bairro, @entrega_cidade, @entrega_uf, @entrega_cep
)
RETURNING *;
