UPDATE cartao_salvo
SET principal = 0
WHERE id_usuario = ?
  AND id_cartao <> ?;
