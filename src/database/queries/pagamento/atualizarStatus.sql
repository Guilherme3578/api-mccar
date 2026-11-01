UPDATE pagamento
SET status = @status,
    aprovado_em = CASE
        WHEN @status = 'APROVADO' THEN COALESCE(aprovado_em, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        ELSE aprovado_em
    END
WHERE id_pagamento = @id_pagamento
RETURNING *;
