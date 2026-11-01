INSERT OR IGNORE INTO categoria (nome, icone) VALUES
    ('Motor', 'engine'),
    ('Arrefecimento', 'coolant-temperature'),
    ('Transmissão', 'cog'),
    ('Freios', 'car-brake-alert'),
    ('Suspensão', 'car-cog'),
    ('Elétrica', 'car-battery'),
    ('Filtros', 'air-filter');

INSERT INTO modelo_veiculo (marca, modelo, ano)
SELECT v.column1, v.column2, v.column3
FROM (VALUES
    ('Chevrolet', 'Onix', 2020),
    ('Hyundai', 'HB20', 2020),
    ('Volkswagen', 'Gol', 2019),
    ('Fiat', 'Argo', 2021),
    ('Toyota', 'Corolla', 2020)
) v
WHERE NOT EXISTS (
    SELECT 1 FROM modelo_veiculo m
    WHERE m.marca = v.column1 AND m.modelo = v.column2 AND m.ano = v.column3
);

INSERT OR IGNORE INTO produto (id_categoria, codigo, nome, marca, descricao, preco_centavos, garantia_meses, destaque, avaliacao_media, avaliacao_quantidade, prazo_envio_horas, frete_gratis_acima_centavos)
SELECT c.id_categoria, p.column2, p.column3, p.column4, p.column5, p.column6, p.column7, p.column8, p.column9, p.column10, p.column11, 10000
FROM (VALUES
    ('Motor', 'MC-001', 'Jogo de Velas de Ignição (4 un.)', 'NGK', 'Jogo com 4 velas de ignição com eletrodo de níquel, garantem partida rápida e queima eficiente do combustível.', 11990, 3, 1, 4.8, 312, 24),
    ('Motor', 'MC-002', 'Correia Dentada', 'Gates', 'Correia de sincronismo em borracha HNBR, resistente a altas temperaturas. Troca recomendada a cada 50.000 km.', 8990, 6, 0, 4.7, 154, 24),
    ('Arrefecimento', 'MC-003', 'Bomba d''Água', 'Nakata', 'Bomba d''água com rotor metálico e vedação reforçada, mantém a circulação do líquido de arrefecimento.', 18990, 6, 0, 4.6, 98, 48),
    ('Arrefecimento', 'MC-004', 'Válvula Termostática', 'MTE-Thomson', 'Controla a temperatura de trabalho do motor liberando o fluxo do líquido de arrefecimento para o radiador.', 7990, 6, 0, 4.5, 76, 24),
    ('Transmissão', 'MC-005', 'Kit de Embreagem', 'LuK', 'Kit completo com platô, disco e rolamento, proporciona engates suaves e maior durabilidade.', 69990, 12, 1, 4.8, 203, 48),
    ('Freios', 'MC-006', 'Pastilha de Freio Dianteira', 'Bosch', 'Jogo de pastilhas dianteiras com baixo nível de ruído e poeira, alta eficiência de frenagem.', 12990, 6, 1, 4.9, 487, 24),
    ('Freios', 'MC-007', 'Disco de Freio Ventilado (par)', 'Fremax', 'Par de discos ventilados com tratamento anticorrosivo, melhor dissipação de calor em frenagens intensas.', 28990, 6, 1, 4.8, 265, 24),
    ('Freios', 'MC-008', 'Fluido de Freio DOT 4 (500 ml)', 'Bosch', 'Fluido de freio sintético DOT 4 com alto ponto de ebulição, indicado para sistemas ABS.', 3490, 0, 0, 4.9, 538, 24),
    ('Freios', 'MC-009', 'Lona de Freio Traseira (jogo)', 'Fras-le', 'Jogo de lonas para freio a tambor traseiro, sem amianto e com frenagem progressiva.', 7990, 6, 0, 4.6, 121, 24),
    ('Suspensão', 'MC-010', 'Amortecedor Dianteiro', 'Cofap', 'Amortecedor dianteiro pressurizado a gás, garante estabilidade e conforto ao rodar.', 34990, 12, 1, 4.7, 342, 48),
    ('Suspensão', 'MC-011', 'Mola Helicoidal Dianteira (par)', 'Fabrini', 'Par de molas dianteiras em aço especial, mantém a altura original e o conforto da suspensão.', 23990, 12, 0, 4.5, 64, 48),
    ('Suspensão', 'MC-012', 'Pivô de Suspensão', 'Nakata', 'Pivô da bandeja com esfera blindada e coifa de proteção, elimina folgas e ruídos na direção.', 6990, 6, 0, 4.6, 187, 24),
    ('Suspensão', 'MC-013', 'Bucha da Bandeja', 'Sampel', 'Bucha de borracha da bandeja dianteira, absorve vibrações e impactos da suspensão.', 3990, 6, 0, 4.4, 92, 24),
    ('Elétrica', 'MC-014', 'Bateria 60Ah', 'Moura', 'Bateria selada 60Ah livre de manutenção, alta durabilidade e partida confiável.', 54990, 15, 1, 4.9, 621, 24),
    ('Elétrica', 'MC-015', 'Lâmpada de Farol H4 (par)', 'Philips', 'Par de lâmpadas halógenas H4 60/55W com luz mais branca e até 30% mais visibilidade.', 7990, 3, 0, 4.7, 276, 24),
    ('Elétrica', 'MC-016', 'Alternador', 'Bosch', 'Alternador 90A novo, mantém a carga da bateria e alimenta todo o sistema elétrico do veículo.', 114990, 12, 0, 4.7, 58, 72),
    ('Elétrica', 'MC-017', 'Motor de Partida', 'Bosch', 'Motor de partida novo com alto torque, garante partidas rápidas mesmo em dias frios.', 89990, 12, 0, 4.6, 47, 72),
    ('Elétrica', 'MC-018', 'Sonda Lambda', 'Bosch', 'Sensor de oxigênio que ajusta a mistura ar/combustível, reduz consumo e emissões.', 34990, 12, 0, 4.7, 133, 48),
    ('Filtros', 'MC-019', 'Filtro de Óleo', 'Tecfil', 'Filtro de óleo com elemento filtrante de alta eficiência, protege o motor contra impurezas.', 2990, 0, 0, 4.8, 704, 24),
    ('Filtros', 'MC-020', 'Filtro de Ar do Motor', 'Mann-Filter', 'Filtro de ar do motor que retém poeira e partículas, preservando o desempenho e o consumo.', 4990, 0, 0, 4.8, 389, 24),
    ('Filtros', 'MC-021', 'Filtro de Combustível', 'Tecfil', 'Filtro de combustível que impede a passagem de impurezas para os bicos injetores.', 3990, 0, 0, 4.7, 245, 24),
    ('Filtros', 'MC-022', 'Filtro de Cabine', 'Wega', 'Filtro de ar-condicionado com carvão ativado, elimina odores e partículas do interior do veículo.', 4490, 0, 0, 4.7, 298, 24)
) p
JOIN categoria c ON c.nome = p.column1;

INSERT OR IGNORE INTO especificacao_produto (id_produto, nome, valor)
SELECT p.id_produto, e.column2, e.column3
FROM (VALUES
    ('MC-001', 'Quantidade', '4 unidades'),
    ('MC-001', 'Eletrodo', 'Níquel'),
    ('MC-001', 'Rosca', '14 mm'),
    ('MC-002', 'Material', 'Borracha HNBR'),
    ('MC-002', 'Troca recomendada', '50.000 km'),
    ('MC-003', 'Rotor', 'Metálico'),
    ('MC-003', 'Acompanha', 'Junta de vedação'),
    ('MC-004', 'Temperatura de abertura', '87 °C'),
    ('MC-004', 'Acompanha', 'Anel de vedação'),
    ('MC-005', 'Itens', 'Platô, disco e rolamento'),
    ('MC-005', 'Diâmetro do disco', '200 mm'),
    ('MC-006', 'Posição', 'Dianteira'),
    ('MC-006', 'Material', 'Cerâmica'),
    ('MC-006', 'Quantidade', '4 pastilhas'),
    ('MC-007', 'Tipo', 'Ventilado'),
    ('MC-007', 'Diâmetro', '256 mm'),
    ('MC-007', 'Quantidade', '2 discos'),
    ('MC-008', 'Especificação', 'DOT 4'),
    ('MC-008', 'Volume', '500 ml'),
    ('MC-008', 'Ponto de ebulição', '260 °C'),
    ('MC-009', 'Posição', 'Traseira'),
    ('MC-009', 'Sistema', 'Freio a tambor'),
    ('MC-010', 'Posição', 'Dianteiro'),
    ('MC-010', 'Tipo', 'Pressurizado a gás'),
    ('MC-011', 'Posição', 'Dianteira'),
    ('MC-011', 'Quantidade', '2 molas'),
    ('MC-012', 'Posição', 'Inferior dianteiro'),
    ('MC-012', 'Lado', 'Direito e esquerdo'),
    ('MC-013', 'Material', 'Borracha'),
    ('MC-013', 'Posição', 'Bandeja dianteira'),
    ('MC-014', 'Capacidade', '60Ah'),
    ('MC-014', 'Tensão', '12V'),
    ('MC-014', 'Tipo', 'Selada, livre de manutenção'),
    ('MC-015', 'Tipo', 'H4 halógena'),
    ('MC-015', 'Potência', '60/55W'),
    ('MC-015', 'Quantidade', '2 lâmpadas'),
    ('MC-016', 'Corrente', '90A'),
    ('MC-016', 'Tensão', '12V'),
    ('MC-017', 'Potência', '1,1 kW'),
    ('MC-017', 'Tensão', '12V'),
    ('MC-018', 'Tipo', 'Pré-catalisador'),
    ('MC-018', 'Fios', '4'),
    ('MC-019', 'Rosca', '3/4" - 16 UNF'),
    ('MC-019', 'Troca recomendada', 'A cada troca de óleo'),
    ('MC-020', 'Material', 'Papel filtrante'),
    ('MC-020', 'Troca recomendada', '10.000 km'),
    ('MC-021', 'Combustível', 'Flex'),
    ('MC-021', 'Troca recomendada', '10.000 km'),
    ('MC-022', 'Elemento', 'Carvão ativado'),
    ('MC-022', 'Troca recomendada', '10.000 km')
) e
JOIN produto p ON p.codigo = e.column1;

INSERT OR IGNORE INTO produto_veiculo (id_produto, id_modelo_veiculo)
SELECT p.id_produto, m.id_modelo_veiculo
FROM (VALUES
    ('MC-001', 'Onix'), ('MC-001', 'HB20'), ('MC-001', 'Gol'), ('MC-001', 'Argo'), ('MC-001', 'Corolla'),
    ('MC-002', 'Onix'), ('MC-002', 'Gol'),
    ('MC-003', 'Onix'), ('MC-003', 'HB20'), ('MC-003', 'Gol'), ('MC-003', 'Argo'), ('MC-003', 'Corolla'),
    ('MC-004', 'Onix'), ('MC-004', 'HB20'), ('MC-004', 'Gol'), ('MC-004', 'Argo'), ('MC-004', 'Corolla'),
    ('MC-005', 'Onix'), ('MC-005', 'HB20'), ('MC-005', 'Gol'), ('MC-005', 'Argo'),
    ('MC-006', 'Onix'), ('MC-006', 'HB20'), ('MC-006', 'Gol'), ('MC-006', 'Argo'), ('MC-006', 'Corolla'),
    ('MC-007', 'Onix'), ('MC-007', 'HB20'), ('MC-007', 'Argo'), ('MC-007', 'Corolla'),
    ('MC-008', 'Onix'), ('MC-008', 'HB20'), ('MC-008', 'Gol'), ('MC-008', 'Argo'), ('MC-008', 'Corolla'),
    ('MC-009', 'Onix'), ('MC-009', 'HB20'), ('MC-009', 'Gol'), ('MC-009', 'Argo'),
    ('MC-010', 'Onix'), ('MC-010', 'HB20'), ('MC-010', 'Gol'), ('MC-010', 'Argo'), ('MC-010', 'Corolla'),
    ('MC-011', 'Onix'), ('MC-011', 'HB20'), ('MC-011', 'Gol'), ('MC-011', 'Argo'),
    ('MC-012', 'Onix'), ('MC-012', 'HB20'), ('MC-012', 'Gol'), ('MC-012', 'Argo'),
    ('MC-013', 'Onix'), ('MC-013', 'HB20'), ('MC-013', 'Gol'), ('MC-013', 'Argo'), ('MC-013', 'Corolla'),
    ('MC-014', 'Onix'), ('MC-014', 'HB20'), ('MC-014', 'Gol'), ('MC-014', 'Argo'), ('MC-014', 'Corolla'),
    ('MC-015', 'Onix'), ('MC-015', 'HB20'), ('MC-015', 'Gol'), ('MC-015', 'Argo'),
    ('MC-016', 'Onix'), ('MC-016', 'Gol'), ('MC-016', 'Argo'),
    ('MC-017', 'Onix'), ('MC-017', 'HB20'), ('MC-017', 'Gol'), ('MC-017', 'Argo'),
    ('MC-018', 'Onix'), ('MC-018', 'HB20'), ('MC-018', 'Gol'), ('MC-018', 'Argo'), ('MC-018', 'Corolla'),
    ('MC-019', 'Onix'), ('MC-019', 'HB20'), ('MC-019', 'Gol'), ('MC-019', 'Argo'), ('MC-019', 'Corolla'),
    ('MC-020', 'Onix'), ('MC-020', 'HB20'), ('MC-020', 'Gol'), ('MC-020', 'Argo'), ('MC-020', 'Corolla'),
    ('MC-021', 'Onix'), ('MC-021', 'HB20'), ('MC-021', 'Gol'), ('MC-021', 'Argo'), ('MC-021', 'Corolla'),
    ('MC-022', 'Onix'), ('MC-022', 'HB20'), ('MC-022', 'Gol'), ('MC-022', 'Argo'), ('MC-022', 'Corolla')
) v
JOIN produto p ON p.codigo = v.column1
JOIN modelo_veiculo m ON m.modelo = v.column2;
