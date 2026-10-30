UPDATE pedido
SET status = @status
WHERE id_pedido = @id_pedido;
