SELECT substr(criado_em, 1, 10) AS dia,
       COUNT(*) AS pedidos,
       SUM(total_centavos) AS faturamento_centavos
FROM pedido
WHERE status IN ('PAGO', 'ENVIADO', 'ENTREGUE')
GROUP BY dia
ORDER BY dia;
