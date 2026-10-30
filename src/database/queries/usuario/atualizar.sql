UPDATE usuario
SET nome = @nome,
    email = @email
WHERE id_usuario = @id_usuario
RETURNING id_usuario, nome, email, perfil, criado_em;
