INSERT INTO usuario (nome, email, senha_hash)
VALUES (@nome, @email, @senha_hash)
RETURNING id_usuario, nome, email, perfil, criado_em;
