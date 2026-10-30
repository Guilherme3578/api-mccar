UPDATE pagamento
SET status = @status,
    aprovado_em = CASE
        WHEN @status = 'APROVADO' THEN COALESCE(aprovado_em, datetime('now'))
        ELSE aprovado_em
    END
WHERE id_pagamento = @id_pagamento
RETURNING *;
