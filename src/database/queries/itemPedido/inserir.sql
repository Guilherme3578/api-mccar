INSERT INTO item_pedido (id_pedido, id_produto, nome_produto, codigo_produto, quantidade, preco_unitario_centavos)
VALUES (@id_pedido, @id_produto, @nome_produto, @codigo_produto, @quantidade, @preco_unitario_centavos)
RETURNING *;
