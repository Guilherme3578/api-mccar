SELECT *
FROM carrinho
WHERE (@id_usuario IS NULL OR id_usuario = @id_usuario)
ORDER BY id_carrinho;
