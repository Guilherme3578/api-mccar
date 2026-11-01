SELECT COUNT(*) AS quantidade_itens,
       COALESCE(SUM(i.quantidade * i.preco_unitario_centavos), 0) AS subtotal_centavos,
       COALESCE(MAX(p.prazo_envio_horas), 0) AS maior_prazo_envio_horas
FROM item_pedido i
JOIN produto p ON p.id_produto = i.id_produto
WHERE i.id_pedido = ?;
