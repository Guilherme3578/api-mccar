INSERT INTO cartao_salvo (id_usuario, apelido, bandeira, ultimos_quatro, nome_titular, principal)
VALUES (@id_usuario, @apelido, @bandeira, @ultimos_quatro, @nome_titular, @principal)
RETURNING *;
