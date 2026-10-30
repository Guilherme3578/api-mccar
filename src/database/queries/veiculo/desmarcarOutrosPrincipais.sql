UPDATE veiculo
SET principal = 0
WHERE id_usuario = ?
  AND id_veiculo <> ?;
