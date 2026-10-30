INSERT INTO carrinho (id_usuario)
VALUES (@id_usuario)
RETURNING *;
