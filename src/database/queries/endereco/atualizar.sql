UPDATE endereco
SET logradouro = @logradouro,
    numero = @numero,
    complemento = @complemento,
    bairro = @bairro,
    cidade = @cidade,
    uf = @uf,
    cep = @cep,
    principal = @principal
WHERE id_endereco = @id_endereco
RETURNING *;
