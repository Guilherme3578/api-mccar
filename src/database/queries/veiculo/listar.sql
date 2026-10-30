SELECT v.id_veiculo, v.id_usuario, v.id_modelo_veiculo, v.principal, m.marca, m.modelo, m.ano
FROM veiculo v
JOIN modelo_veiculo m ON m.id_modelo_veiculo = v.id_modelo_veiculo
WHERE (@id_usuario IS NULL OR v.id_usuario = @id_usuario)
ORDER BY v.id_usuario, v.principal DESC, v.id_veiculo;
