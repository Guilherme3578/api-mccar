UPDATE endereco
SET principal = 0
WHERE id_usuario = ?
  AND id_endereco <> ?;
