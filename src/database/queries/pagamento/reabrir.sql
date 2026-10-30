UPDATE pagamento
SET id_cartao = @id_cartao,
    metodo = @metodo,
    valor_centavos = @valor_centavos,
    cartao_bandeira = @cartao_bandeira,
    cartao_final = @cartao_final,
    status = 'PENDENTE',
    criado_em = datetime('now'),
    aprovado_em = NULL
WHERE id_pagamento = @id_pagamento
RETURNING *;
