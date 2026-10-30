INSERT INTO favorito (id_usuario, id_produto)
VALUES (@id_usuario, @id_produto)
RETURNING *;
