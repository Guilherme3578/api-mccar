SELECT f.id_usuario, f.criado_em AS favoritado_em, p.*
FROM favorito f
JOIN produto p ON p.id_produto = f.id_produto
WHERE f.id_usuario = ?
ORDER BY f.criado_em DESC;
