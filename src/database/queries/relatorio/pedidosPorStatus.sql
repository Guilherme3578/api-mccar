SELECT status,
       COUNT(*) AS quantidade,
       SUM(total_centavos) AS valor_centavos
FROM pedido
WHERE status <> 'RASCUNHO'
GROUP BY status
ORDER BY quantidade DESC;
