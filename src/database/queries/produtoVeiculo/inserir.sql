INSERT INTO produto_veiculo (id_produto, id_modelo_veiculo)
VALUES (@id_produto, @id_modelo_veiculo)
RETURNING *;
