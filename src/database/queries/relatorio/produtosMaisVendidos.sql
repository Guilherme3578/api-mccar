SELECT i.codigo_produto AS codigo,
       i.nome_produto AS nome,
       p.marca,
       SUM(i.quantidade) AS quantidade,
       SUM(i.quantidade * i.preco_unitario_centavos) AS faturamento_bruto_centavos
FROM item_pedido i
JOIN pedido pe ON pe.id_pedido = i.id_pedido
JOIN produto p ON p.id_produto = i.id_produto
WHERE pe.status IN ('PAGO', 'ENVIADO', 'ENTREGUE')
GROUP BY i.id_produto, i.codigo_produto, i.nome_produto, p.marca
ORDER BY quantidade DESC, faturamento_bruto_centavos DESC;
