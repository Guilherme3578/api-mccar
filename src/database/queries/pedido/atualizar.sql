UPDATE pedido
SET id_endereco = @id_endereco,
    id_cupom = @id_cupom,
    status = @status,
    subtotal_centavos = @subtotal_centavos,
    frete_centavos = @frete_centavos,
    desconto_centavos = @desconto_centavos,
    total_centavos = @total_centavos,
    prazo_min_dias = @prazo_min_dias,
    prazo_max_dias = @prazo_max_dias,
    entrega_logradouro = @entrega_logradouro,
    entrega_numero = @entrega_numero,
    entrega_complemento = @entrega_complemento,
    entrega_bairro = @entrega_bairro,
    entrega_cidade = @entrega_cidade,
    entrega_uf = @entrega_uf,
    entrega_cep = @entrega_cep
WHERE id_pedido = @id_pedido
RETURNING *;
