SELECT COUNT(*) AS quantidade_itens,
       COALESCE(SUM(i.quantidade * i.preco_unitario_centavos), 0) AS subtotal_centavos,
       COALESCE(MAX(p.prazo_envio_horas), 0) AS maior_prazo_envio_horas,
       COALESCE(MIN(p.frete_gratis_acima_centavos), 0) AS menor_limite_frete_gratis_centavos,
       COALESCE(MAX(p.frete_gratis_acima_centavos), 0) AS maior_limite_frete_gratis_centavos
FROM item_pedido i
JOIN produto p ON p.id_produto = i.id_produto
WHERE i.id_pedido = ?;
