UPDATE especificacao_produto
SET valor = @valor
WHERE id_produto = @id_produto
  AND nome = @nome
RETURNING *;
