SELECT *
FROM endereco
WHERE (@id_usuario IS NULL OR id_usuario = @id_usuario)
ORDER BY id_usuario, principal DESC, id_endereco;
