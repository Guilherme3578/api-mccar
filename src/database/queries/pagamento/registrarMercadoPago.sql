UPDATE pagamento
SET mp_pagamento_id = @mp_pagamento_id,
    metodo = @metodo,
    cartao_bandeira = COALESCE(@cartao_bandeira, cartao_bandeira),
    cartao_final = COALESCE(@cartao_final, cartao_final)
WHERE id_pagamento = @id_pagamento
RETURNING *;
