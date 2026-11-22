import json
import sys
from pathlib import Path

from streamlit.testing.v1 import AppTest

PASTA = Path(__file__).parent
DADOS = json.loads((PASTA / "dados-exemplo.json").read_text(encoding="utf-8"))
FALHAS = []


def conferir(condicao, mensagem):
    print(("OK  " if condicao else "XX  ") + mensagem)
    if not condicao:
        FALHAS.append(mensagem)


def reais(centavos):
    return "R$ " + f"{centavos / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


app = AppTest.from_file(str(PASTA / "app.py"), default_timeout=60).run()
metricas = {m.label: m.value for m in app.metric}
resumo = DADOS["resumo"]

conferir(not app.exception, "o dashboard abre sem erros")
conferir(metricas.get("Faturamento") == reais(resumo["faturamento_centavos"]), "faturamento igual ao calculado pela API")
conferir(metricas.get("Pedidos pagos") == str(resumo["pedidos_pagos"]), "pedidos pagos iguais aos da API")
conferir(metricas.get("Ticket médio") == reais(resumo["ticket_medio_centavos"]), "ticket médio igual ao da API")
conferir(len(app.get("plotly_chart")) == 6, "os 6 gráficos são exibidos")
conferir(len(app.subheader) == 7, "as 7 seções são exibidas")

print(f"\n{len(FALHAS)} falha(s)" if FALHAS else "\nTODOS OS TESTES DO DASHBOARD PASSARAM")
sys.exit(1 if FALHAS else 0)
