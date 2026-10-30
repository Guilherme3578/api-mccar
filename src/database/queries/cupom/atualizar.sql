UPDATE cupom
SET codigo = @codigo,
    tipo = @tipo,
    valor = @valor,
    minimo_compra_centavos = @minimo_compra_centavos,
    valido_ate = @valido_ate,
    ativo = @ativo
WHERE id_cupom = @id_cupom
RETURNING *;
