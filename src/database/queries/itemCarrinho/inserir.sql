INSERT INTO item_carrinho (id_carrinho, id_produto, quantidade)
VALUES (@id_carrinho, @id_produto, @quantidade)
RETURNING *;
