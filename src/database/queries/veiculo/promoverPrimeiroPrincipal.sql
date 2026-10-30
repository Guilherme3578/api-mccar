UPDATE veiculo
SET principal = 1
WHERE id_veiculo = (
        SELECT id_veiculo
        FROM veiculo
        WHERE id_usuario = @id_usuario
        ORDER BY id_veiculo
        LIMIT 1
      )
  AND NOT EXISTS (
        SELECT 1
        FROM veiculo
        WHERE id_usuario = @id_usuario
          AND principal = 1
      );
