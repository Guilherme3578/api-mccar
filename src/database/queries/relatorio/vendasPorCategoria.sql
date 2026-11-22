SELECT c.nome AS categoria,
       SUM(i.quantidade) AS itens,
       SUM(i.quantidade * i.preco_unitario_centavos) AS faturamento_bruto_centavos
FROM item_pedido i
JOIN pedido pe ON pe.id_pedido = i.id_pedido
JOIN produto p ON p.id_produto = i.id_produto
JOIN categoria c ON c.id_categoria = p.id_categoria
WHERE pe.status IN ('PAGO', 'ENVIADO', 'ENTREGUE')
GROUP BY c.id_categoria, c.nome
ORDER BY faturamento_bruto_centavos DESC;
