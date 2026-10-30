INSERT INTO categoria (nome, icone)
VALUES (@nome, @icone)
RETURNING *;
