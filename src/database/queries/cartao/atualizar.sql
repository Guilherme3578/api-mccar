UPDATE cartao_salvo
SET apelido = @apelido,
    bandeira = @bandeira,
    ultimos_quatro = @ultimos_quatro,
    nome_titular = @nome_titular,
    principal = @principal
WHERE id_cartao = @id_cartao
RETURNING *;
