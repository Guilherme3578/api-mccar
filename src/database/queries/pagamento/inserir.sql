INSERT INTO pagamento (id_pedido, id_usuario, id_cartao, metodo, valor_centavos, cartao_bandeira, cartao_final, mp_preferencia_id)
VALUES (@id_pedido, @id_usuario, @id_cartao, @metodo, @valor_centavos, @cartao_bandeira, @cartao_final, @mp_preferencia_id)
RETURNING *;
