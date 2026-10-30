INSERT INTO especificacao_produto (id_produto, nome, valor)
VALUES (@id_produto, @nome, @valor)
RETURNING *;
