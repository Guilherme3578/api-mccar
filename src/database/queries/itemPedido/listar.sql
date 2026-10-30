SELECT *, quantidade * preco_unitario_centavos AS total_centavos
FROM item_pedido
WHERE id_pedido = ?
ORDER BY nome_produto;
