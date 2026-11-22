UPDATE pagamento
SET criado_em = @data,
    aprovado_em = CASE WHEN aprovado_em IS NULL THEN NULL ELSE @data END
WHERE id_pedido = @id_pedido;
