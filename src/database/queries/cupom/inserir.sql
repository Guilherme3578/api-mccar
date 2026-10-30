INSERT INTO cupom (codigo, tipo, valor, minimo_compra_centavos, valido_ate, ativo)
VALUES (@codigo, @tipo, @valor, @minimo_compra_centavos, @valido_ate, @ativo)
RETURNING *;
