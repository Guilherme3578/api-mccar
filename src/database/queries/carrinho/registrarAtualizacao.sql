UPDATE carrinho
SET atualizado_em = datetime('now')
WHERE id_carrinho = ?;
