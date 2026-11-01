SELECT COUNT(*) AS total
FROM pedido
WHERE id_usuario = @id_usuario
  AND id_pedido <> @id_pedido
  AND status NOT IN ('RASCUNHO', 'CANCELADO');
