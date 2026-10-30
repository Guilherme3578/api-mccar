UPDATE categoria
SET nome = @nome,
    icone = @icone
WHERE id_categoria = @id_categoria
RETURNING *;
