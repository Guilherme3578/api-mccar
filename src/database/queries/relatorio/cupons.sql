SELECT c.codigo,
       c.tipo,
       c.valor,
       COUNT(pe.id_pedido) AS usos,
       COALESCE(SUM(pe.desconto_centavos), 0) AS desconto_centavos
FROM cupom c
LEFT JOIN pedido pe ON pe.id_cupom = c.id_cupom AND pe.status IN ('PAGO', 'ENVIADO', 'ENTREGUE')
GROUP BY c.id_cupom, c.codigo, c.tipo, c.valor
ORDER BY usos DESC, c.codigo;
