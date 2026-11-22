import json
import urllib.error
import urllib.request
from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st

PASTA = Path(__file__).parent
ARQUIVO_EXEMPLO = PASTA / "dados-exemplo.json"
STATUS_FATURADOS = ["PAGO", "ENVIADO", "ENTREGUE"]
CORES = ["#F2B705", "#1F2A44", "#3E7CB1", "#81A4CD", "#D9534F", "#5CB85C", "#8E6C8A", "#F0AD4E"]
NOMES_STATUS = {
    "AGUARDANDO_PAGAMENTO": "Aguardando pagamento",
    "PAGO": "Pago",
    "ENVIADO": "Enviado",
    "ENTREGUE": "Entregue",
    "CANCELADO": "Cancelado",
}
NOMES_METODO = {"PIX": "Pix", "CARTAO": "Cartão", "BOLETO": "Boleto", "MERCADO_PAGO": "Mercado Pago"}


def reais(centavos):
    texto = f"{centavos / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {texto}"


def requisitar(url, corpo=None, token=None):
    cabecalhos = {"Content-Type": "application/json"}
    if token:
        cabecalhos["Authorization"] = f"Bearer {token}"
    dados = json.dumps(corpo).encode() if corpo is not None else None
    pedido = urllib.request.Request(url, data=dados, headers=cabecalhos, method="POST" if corpo is not None else "GET")
    try:
        with urllib.request.urlopen(pedido, timeout=15) as resposta:
            return json.loads(resposta.read().decode())
    except urllib.error.HTTPError as erro:
        mensagem = json.loads(erro.read().decode() or "{}").get("erro", f"Erro {erro.code}")
        raise RuntimeError(mensagem) from erro
    except urllib.error.URLError as erro:
        raise RuntimeError(f"Não foi possível conectar à API em {url}") from erro


def buscar_da_api(url_base, email, senha):
    url_base = url_base.rstrip("/")
    login = requisitar(f"{url_base}/usuarios/login", {"email": email, "senha": senha})
    return requisitar(f"{url_base}/relatorios/dados", token=login["token"])


def carregar_dados():
    st.sidebar.header("Fonte dos dados")
    fonte = st.sidebar.radio("Origem", ["Arquivo JSON", "API ao vivo"], label_visibility="collapsed")

    if fonte == "Arquivo JSON":
        enviado = st.sidebar.file_uploader("JSON gerado pelo app", type="json")
        if enviado is not None:
            return json.load(enviado), enviado.name
        if ARQUIVO_EXEMPLO.exists():
            return json.loads(ARQUIVO_EXEMPLO.read_text(encoding="utf-8")), ARQUIVO_EXEMPLO.name
        return None, None

    url = st.sidebar.text_input("Endereço da API", "http://localhost:3000")
    email = st.sidebar.text_input("E-mail do admin")
    senha = st.sidebar.text_input("Senha", type="password")
    if st.sidebar.button("Buscar dados", type="primary"):
        try:
            st.session_state["dados_api"] = buscar_da_api(url, email, senha)
        except RuntimeError as erro:
            st.sidebar.error(str(erro))
    if "dados_api" in st.session_state:
        return st.session_state["dados_api"], f"API {url}"
    return None, None


def tabela_de_pedidos(dados):
    pedidos = pd.DataFrame(dados.get("pedidos", []))
    if pedidos.empty:
        return pedidos
    pedidos["criado_em"] = pd.to_datetime(pedidos["criado_em"], utc=True)
    pedidos["dia"] = pedidos["criado_em"].dt.tz_convert("America/Sao_Paulo").dt.date
    pedidos["total"] = pedidos["total_centavos"] / 100
    pedidos["faturado"] = pedidos["status"].isin(STATUS_FATURADOS)
    return pedidos


def filtrar_periodo(pedidos):
    if pedidos.empty:
        return pedidos
    inicio, fim = pedidos["dia"].min(), pedidos["dia"].max()
    periodo = st.sidebar.date_input("Período", (inicio, fim), min_value=inicio, max_value=fim)
    if isinstance(periodo, tuple) and len(periodo) == 2:
        return pedidos[(pedidos["dia"] >= periodo[0]) & (pedidos["dia"] <= periodo[1])]
    return pedidos


def indicadores(pedidos):
    faturados = pedidos[pedidos["faturado"]]
    faturamento = int(faturados["total_centavos"].sum())
    quantidade = len(faturados)
    ticket = round(faturamento / quantidade) if quantidade else 0
    cancelados = int((pedidos["status"] == "CANCELADO").sum())
    taxa_cancelamento = cancelados / len(pedidos) * 100 if len(pedidos) else 0
    descontos = int(faturados["desconto_centavos"].sum())

    colunas = st.columns(5)
    colunas[0].metric("Faturamento", reais(faturamento))
    colunas[1].metric("Pedidos pagos", quantidade)
    colunas[2].metric("Ticket médio", reais(ticket))
    colunas[3].metric("Descontos concedidos", reais(descontos))
    colunas[4].metric("Taxa de cancelamento", f"{taxa_cancelamento:.1f}%".replace(".", ","))


def grafico_faturamento_por_dia(pedidos):
    faturados = pedidos[pedidos["faturado"]]
    por_dia = faturados.groupby("dia").agg(faturamento=("total", "sum"), pedidos=("numero", "count")).reset_index()
    if por_dia.empty:
        st.info("Sem vendas no período.")
        return
    por_dia["media_movel"] = por_dia["faturamento"].rolling(7, min_periods=1).mean()
    figura = px.bar(por_dia, x="dia", y="faturamento", labels={"dia": "Dia", "faturamento": "Faturamento (R$)"}, color_discrete_sequence=[CORES[0]])
    figura.add_scatter(x=por_dia["dia"], y=por_dia["media_movel"], mode="lines", name="Média de 7 dias", line={"color": CORES[1], "width": 3})
    figura.update_layout(legend={"orientation": "h", "y": 1.12}, margin={"t": 30})
    st.plotly_chart(figura, width="stretch")


def grafico_pizza(tabela, nomes, valores, titulo_vazio):
    if tabela.empty:
        st.info(titulo_vazio)
        return
    figura = px.pie(tabela, names=nomes, values=valores, hole=0.45, color_discrete_sequence=CORES)
    figura.update_traces(textinfo="percent+label")
    figura.update_layout(showlegend=False, margin={"t": 10, "b": 10})
    st.plotly_chart(figura, width="stretch")


def grafico_barras(tabela, x, y, rotulos, horizontal=False):
    if tabela.empty:
        st.info("Sem dados.")
        return
    figura = px.bar(tabela, x=x, y=y, labels=rotulos, orientation="h" if horizontal else "v", color_discrete_sequence=[CORES[2]], text_auto=True)
    if horizontal:
        figura.update_layout(yaxis={"categoryorder": "total ascending"})
    figura.update_layout(margin={"t": 10})
    st.plotly_chart(figura, width="stretch")


def main():
    st.set_page_config(page_title="MCCAR · Dashboard de Vendas", page_icon="🚗", layout="wide")
    st.title("MCCAR · Dashboard de Vendas")

    dados, origem = carregar_dados()
    if dados is None:
        st.info("Envie o JSON gerado pelo app ou busque os dados direto da API pela barra lateral.")
        return

    st.caption(f"Fonte: {origem} · gerado em {dados.get('gerado_em', '-')}")
    pedidos = tabela_de_pedidos(dados)
    if pedidos.empty:
        st.warning("O JSON não tem pedidos para analisar.")
        return
    pedidos = filtrar_periodo(pedidos)

    indicadores(pedidos)
    st.divider()

    esquerda, direita = st.columns([2, 1])
    with esquerda:
        st.subheader("Faturamento por dia")
        grafico_faturamento_por_dia(pedidos)
    with direita:
        st.subheader("Pedidos por status")
        por_status = pedidos.groupby("status").size().reset_index(name="pedidos")
        por_status["status"] = por_status["status"].map(NOMES_STATUS).fillna(por_status["status"])
        grafico_pizza(por_status, "status", "pedidos", "Sem pedidos.")

    esquerda, direita = st.columns(2)
    with esquerda:
        st.subheader("Formas de pagamento")
        pagos = pedidos[pedidos["faturado"] & pedidos["metodo_pagamento"].notna()]
        por_metodo = pagos.groupby("metodo_pagamento").agg(valor=("total", "sum")).reset_index()
        por_metodo["metodo_pagamento"] = por_metodo["metodo_pagamento"].map(NOMES_METODO).fillna(por_metodo["metodo_pagamento"])
        grafico_pizza(por_metodo, "metodo_pagamento", "valor", "Sem pagamentos aprovados.")
    with direita:
        st.subheader("Faturamento por estado")
        por_estado = pedidos[pedidos["faturado"]].groupby("uf").agg(faturamento=("total", "sum")).reset_index().sort_values("faturamento", ascending=False)
        grafico_barras(por_estado, "uf", "faturamento", {"uf": "Estado", "faturamento": "Faturamento (R$)"})

    st.divider()
    st.caption("Categorias, produtos e cupons consideram todo o histórico do JSON.")
    esquerda, direita = st.columns(2)
    with esquerda:
        st.subheader("Itens vendidos por categoria")
        categorias = pd.DataFrame(dados.get("vendas_por_categoria", []))
        grafico_barras(categorias, "categoria", "itens", {"categoria": "Categoria", "itens": "Itens vendidos"})
    with direita:
        st.subheader("Top 10 produtos")
        produtos = pd.DataFrame(dados.get("produtos_mais_vendidos", [])).head(10)
        grafico_barras(produtos, "quantidade", "nome", {"quantidade": "Unidades vendidas", "nome": ""}, horizontal=True)

    st.subheader("Cupons")
    cupons = pd.DataFrame(dados.get("cupons", []))
    if cupons.empty:
        st.info("Nenhum cupom cadastrado.")
    else:
        cupons["desconto total"] = cupons["desconto_centavos"].map(reais)
        st.dataframe(cupons[["codigo", "tipo", "valor", "usos", "desconto total"]], hide_index=True, width="stretch")

    with st.expander("Pedidos do período"):
        colunas = ["numero", "criado_em", "status", "cidade", "uf", "quantidade_itens", "cupom", "metodo_pagamento", "total"]
        tabela = pedidos[colunas].sort_values("criado_em", ascending=False)
        st.dataframe(tabela, hide_index=True, width="stretch")
        st.download_button("Baixar CSV", tabela.to_csv(index=False).encode("utf-8-sig"), "pedidos-mccar.csv", "text/csv")


if __name__ == "__main__":
    main()
