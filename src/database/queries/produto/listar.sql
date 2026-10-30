SELECT *
FROM produto
WHERE (@id_categoria IS NULL OR id_categoria = @id_categoria)
  AND (@destaque IS NULL OR destaque = @destaque)
  AND (@ativo IS NULL OR ativo = @ativo)
  AND (@busca IS NULL OR nome LIKE '%' || @busca || '%' OR marca LIKE '%' || @busca || '%' OR codigo LIKE '%' || @busca || '%')
  AND (@id_modelo_veiculo IS NULL OR id_produto IN (
        SELECT id_produto
        FROM produto_veiculo
        WHERE id_modelo_veiculo = @id_modelo_veiculo
      ))
ORDER BY destaque DESC, nome;
