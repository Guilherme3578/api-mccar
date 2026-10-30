UPDATE cartao_salvo
SET principal = 1
WHERE id_cartao = (
        SELECT id_cartao
        FROM cartao_salvo
        WHERE id_usuario = @id_usuario
        ORDER BY id_cartao
        LIMIT 1
      )
  AND NOT EXISTS (
        SELECT 1
        FROM cartao_salvo
        WHERE id_usuario = @id_usuario
          AND principal = 1
      );
