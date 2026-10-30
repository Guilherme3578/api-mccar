SELECT i.id_carrinho, i.id_produto, i.quantidade,
       p.nome, p.codigo, p.imagem_uri, p.preco_centavos,
       i.quantidade * p.preco_centavos AS total_centavos
FROM item_carrinho i
JOIN produto p ON p.id_produto = i.id_produto
WHERE i.id_carrinho = ?
ORDER BY p.nome;
