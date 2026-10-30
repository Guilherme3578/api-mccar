INSERT INTO modelo_veiculo (marca, modelo, ano)
VALUES (@marca, @modelo, @ano)
RETURNING *;
