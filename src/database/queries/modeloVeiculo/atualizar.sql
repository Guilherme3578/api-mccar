UPDATE modelo_veiculo
SET marca = @marca,
    modelo = @modelo,
    ano = @ano
WHERE id_modelo_veiculo = @id_modelo_veiculo
RETURNING *;
