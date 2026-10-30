UPDATE item_carrinho
SET quantidade = @quantidade
WHERE id_carrinho = @id_carrinho
  AND id_produto = @id_produto
RETURNING *;
