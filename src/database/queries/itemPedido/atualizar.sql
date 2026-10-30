UPDATE item_pedido
SET quantidade = @quantidade
WHERE id_pedido = @id_pedido
  AND id_produto = @id_produto
RETURNING *;
