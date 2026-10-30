INSERT INTO veiculo (id_usuario, id_modelo_veiculo, principal)
VALUES (@id_usuario, @id_modelo_veiculo, @principal)
RETURNING *;
