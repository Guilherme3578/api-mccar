INSERT INTO endereco (id_usuario, logradouro, numero, complemento, bairro, cidade, uf, cep, principal)
VALUES (@id_usuario, @logradouro, @numero, @complemento, @bairro, @cidade, @uf, @cep, @principal)
RETURNING *;
