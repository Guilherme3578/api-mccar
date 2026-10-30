UPDATE veiculo
SET id_modelo_veiculo = @id_modelo_veiculo,
    principal = @principal
WHERE id_veiculo = @id_veiculo
RETURNING *;
