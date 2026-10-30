UPDATE endereco
SET principal = 1
WHERE id_endereco = (
        SELECT id_endereco
        FROM endereco
        WHERE id_usuario = @id_usuario
        ORDER BY id_endereco
        LIMIT 1
      )
  AND NOT EXISTS (
        SELECT 1
        FROM endereco
        WHERE id_usuario = @id_usuario
          AND principal = 1
      );
