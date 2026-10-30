UPDATE usuario
SET senha_hash = @senha_hash
WHERE id_usuario = @id_usuario;
