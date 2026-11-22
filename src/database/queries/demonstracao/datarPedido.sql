UPDATE pedido
SET criado_em = @data
WHERE id_pedido = @id_pedido;
