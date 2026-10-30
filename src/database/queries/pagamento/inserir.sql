INSERT INTO pagamento (id_pedido, id_usuario, id_cartao, metodo, valor_centavos, cartao_bandeira, cartao_final)
VALUES (@id_pedido, @id_usuario, @id_cartao, @metodo, @valor_centavos, @cartao_bandeira, @cartao_final)
RETURNING *;
