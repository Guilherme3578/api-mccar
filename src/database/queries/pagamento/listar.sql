SELECT *
FROM pagamento
WHERE (@id_usuario IS NULL OR id_usuario = @id_usuario)
  AND (@id_pedido IS NULL OR id_pedido = @id_pedido)
ORDER BY criado_em DESC, id_pagamento DESC;
