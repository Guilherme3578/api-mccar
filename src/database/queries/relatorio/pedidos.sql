SELECT pe.numero,
       pe.criado_em,
       pe.status,
       pe.subtotal_centavos,
       pe.desconto_centavos,
       pe.frete_centavos,
       pe.total_centavos,
       pe.prazo_max_dias,
       pe.entrega_cidade AS cidade,
       pe.entrega_uf AS uf,
       (SELECT COALESCE(SUM(i.quantidade), 0) FROM item_pedido i WHERE i.id_pedido = pe.id_pedido) AS quantidade_itens,
       c.codigo AS cupom,
       pg.metodo AS metodo_pagamento,
       pg.status AS status_pagamento
FROM pedido pe
LEFT JOIN cupom c ON c.id_cupom = pe.id_cupom
LEFT JOIN pagamento pg ON pg.id_pedido = pe.id_pedido
WHERE pe.status <> 'RASCUNHO'
ORDER BY pe.criado_em, pe.id_pedido;
