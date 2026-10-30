SELECT pv.id_produto, m.id_modelo_veiculo, m.marca, m.modelo, m.ano
FROM produto_veiculo pv
JOIN modelo_veiculo m ON m.id_modelo_veiculo = pv.id_modelo_veiculo
WHERE pv.id_produto = ?
ORDER BY m.marca, m.modelo, m.ano;
