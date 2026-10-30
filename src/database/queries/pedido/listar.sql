SELECT *
FROM pedido
WHERE (@id_usuario IS NULL OR id_usuario = @id_usuario)
  AND (@status IS NULL OR status = @status)
ORDER BY criado_em DESC, id_pedido DESC;
