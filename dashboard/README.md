# Dashboard de Vendas MCCAR

Dashboard em Python (Streamlit + pandas + Plotly) que analisa os dados de vendas exportados pela API em JSON.

## Como rodar

```bash
python -m venv .venv
.venv\Scripts\activate          # no Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

O dashboard abre no navegador em `http://localhost:8501`.

## De onde vêm os dados

Na barra lateral:

| Fonte | Como usar |
|---|---|
| **Arquivo JSON** | Envie o arquivo gerado pelo botão do app, ou baixado em `GET /relatorios/dados?download=1`. Sem arquivo, usa o `dados-exemplo.json` |
| **API ao vivo** | Informe o endereço da API (ex.: `http://localhost:3000`) e o login de um usuário **admin** |

O `dados-exemplo.json` foi gerado pela API depois de rodar `npm run seed:vendas`: 30 clientes e 140 pedidos nos últimos 60 dias.

## O que o dashboard mostra

| Seção | Fonte no JSON |
|---|---|
| Indicadores: faturamento, pedidos pagos, ticket médio, descontos, taxa de cancelamento | `pedidos` (recalculados para o período escolhido) |
| Faturamento por dia, com média móvel de 7 dias | `pedidos` |
| Pedidos por status | `pedidos` |
| Formas de pagamento | `pedidos` |
| Faturamento por estado | `pedidos` |
| Itens vendidos por categoria | `vendas_por_categoria` |
| Top 10 produtos | `produtos_mais_vendidos` |
| Cupons | `cupons` |
| Tabela de pedidos, com download em CSV | `pedidos` |

Os gráficos baseados em `pedidos` respeitam o filtro de **período** da barra lateral. Faturamento considera apenas pedidos `PAGO`, `ENVIADO` e `ENTREGUE`.

## Teste

```bash
python teste_dashboard.py
```

Abre o dashboard sem navegador e confere se ele carrega sem erros, se os indicadores batem com os valores calculados pela API e se os 6 gráficos e as 7 seções aparecem.
