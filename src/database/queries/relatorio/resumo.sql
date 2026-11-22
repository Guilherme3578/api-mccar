SELECT
    (SELECT COUNT(*) FROM pedido WHERE status <> 'RASCUNHO') AS pedidos_total,
    (SELECT COUNT(*) FROM pedido WHERE status IN ('PAGO', 'ENVIADO', 'ENTREGUE')) AS pedidos_pagos,
    (SELECT COUNT(*) FROM pedido WHERE status = 'AGUARDANDO_PAGAMENTO') AS pedidos_aguardando,
    (SELECT COUNT(*) FROM pedido WHERE status = 'CANCELADO') AS pedidos_cancelados,
    (SELECT COALESCE(SUM(total_centavos), 0) FROM pedido WHERE status IN ('PAGO', 'ENVIADO', 'ENTREGUE')) AS faturamento_centavos,
    (SELECT COALESCE(SUM(desconto_centavos), 0) FROM pedido WHERE status IN ('PAGO', 'ENVIADO', 'ENTREGUE')) AS descontos_centavos,
    (SELECT COALESCE(SUM(frete_centavos), 0) FROM pedido WHERE status IN ('PAGO', 'ENVIADO', 'ENTREGUE')) AS frete_centavos,
    (SELECT COUNT(*) FROM usuario WHERE perfil = 'CLIENTE') AS clientes,
    (SELECT COUNT(DISTINCT id_usuario) FROM pedido WHERE status IN ('PAGO', 'ENVIADO', 'ENTREGUE')) AS clientes_que_compraram,
    (SELECT COUNT(*) FROM produto WHERE ativo = 1) AS produtos_ativos;
