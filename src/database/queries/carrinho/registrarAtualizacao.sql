UPDATE carrinho
SET atualizado_em = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE id_carrinho = ?;
