SELECT metodo,
       COUNT(*) AS quantidade,
       SUM(valor_centavos) AS valor_centavos
FROM pagamento
WHERE status = 'APROVADO'
GROUP BY metodo
ORDER BY quantidade DESC;
