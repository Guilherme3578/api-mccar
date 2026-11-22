SELECT entrega_uf AS uf,
       COUNT(*) AS pedidos,
       SUM(total_centavos) AS faturamento_centavos
FROM pedido
WHERE status IN ('PAGO', 'ENVIADO', 'ENTREGUE')
GROUP BY entrega_uf
ORDER BY faturamento_centavos DESC;
