SELECT id_usuario, nome, email, senha_hash, perfil, criado_em
FROM usuario
WHERE email = ?;
