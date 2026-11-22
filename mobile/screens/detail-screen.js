import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, styles } from '../styles/theme';
import {
  ScreenShell,
  TopBar,
  IconButton,
  ProductImage,
  QtyStepper,
  PrimaryButton,
  InfoRow,
  Stars,
  Sheet,
  SelectRow,
  Loading,
  ErrorState,
  nomeVeiculo,
} from '../components/ui';
import { detalharProduto, listarCategorias } from '../services/catalog';
import { brl, brlCurto } from '../utils/format';

function faixaAnos(lista) {
  const grupos = {};
  lista.forEach(function (v) {
    const chave = v.marca + ' ' + v.modelo;
    grupos[chave] = grupos[chave] || [];
    grupos[chave].push(Number(v.ano));
  });
  return Object.keys(grupos).map(function (nome) {
    const anos = grupos[nome].sort((a, b) => a - b);
    const min = anos[0];
    const max = anos[anos.length - 1];
    return { nome: nome, anos: min === max ? String(min) : min + '–' + max, quantidade: anos.length };
  });
}

export default function Detail({ go, back, productId, cartCount, favorites, toggleFavorite, addToCart, vehicle }) {
  const [produto, setProduto] = useState(null);
  const [error, setError] = useState('');
  const [qtd, setQtd] = useState(1);
  const [busy, setBusy] = useState(false);
  const [sheetCompat, setSheetCompat] = useState(false);

  const carregar = useCallback(
    async function () {
      setError('');
      try {
        const resultados = await Promise.all([detalharProduto(productId), listarCategorias().catch(() => [])]);
        const categoria = resultados[1].find((c) => c.id_categoria === resultados[0].id_categoria);
        setProduto({ ...resultados[0], categoria_icone: categoria ? categoria.icone : undefined });
      } catch (e) {
        setError(e.message);
      }
    },
    [productId]
  );

  useEffect(
    function () {
      carregar();
    },
    [carregar]
  );

  async function adicionar() {
    setBusy(true);
    try {
      await addToCart(produto, qtd);
      Alert.alert('Carrinho', 'Produto adicionado ao carrinho.', [
        { text: 'Continuar comprando', style: 'cancel' },
        { text: 'Ver carrinho', onPress: () => go('cart', {}, { reset: true }) },
      ]);
    } catch (e) {
      Alert.alert('Carrinho', e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!produto) {
    return (
      <ScreenShell tabs={false}>
        <TopBar title="Detalhes" onBack={back} />
        {error ? <ErrorState message={error} onRetry={carregar} /> : <Loading />}
      </ScreenShell>
    );
  }

  const favorito = favorites.includes(produto.id_produto);
  const compativeis = produto.veiculos_compativeis || [];
  const grupos = faixaAnos(compativeis);
  const compativelComMeu = vehicle ? compativeis.some((v) => v.id_modelo_veiculo === vehicle.id_modelo_veiculo) : null;
  const prazoDias = Math.max(1, Math.ceil((produto.prazo_envio_horas || 0) / 24));
  const envio = produto.prazo_envio_horas <= 24 ? 'envio em 24h' : 'envio em até ' + prazoDias + ' dias';

  let compatValor = 'Universal';
  let compatSub = null;
  if (grupos.length > 0) {
    if (compativelComMeu) {
      compatValor = nomeVeiculo(vehicle);
      compatSub = compativeis.length > 1 ? 'Compatível com seu veículo · e mais ' + (compativeis.length - 1) : 'Compatível com seu veículo';
    } else {
      compatValor = grupos[0].nome + ' ' + grupos[0].anos;
      const resto = compativeis.length - grupos[0].quantidade;
      if (resto > 0) compatSub = 'e mais ' + resto + (resto === 1 ? ' veículo' : ' veículos');
      if (vehicle) compatSub = (compatSub ? compatSub + ' · ' : '') + 'não serve no seu ' + vehicle.modelo;
    }
  }

  const entrega =
    produto.frete_gratis_acima_centavos > 0 ? 'Grátis acima de ' + brlCurto(produto.frete_gratis_acima_centavos) : 'Calculada no carrinho';
  const especificacoes = produto.especificacoes || [];
  const nota = produto.avaliacao_media ? Number(produto.avaliacao_media).toFixed(1).replace('.', ',') : '—';

  return (
    <ScreenShell tabs={false}>
      <TopBar
        title="Detalhes"
        onBack={back}
        right={
          <IconButton
            icon={favorito ? 'heart' : 'heart-outline'}
            family="mci"
            color={favorito ? COLORS.red : COLORS.dark}
            label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            onPress={() => toggleFavorite(produto.id_produto)}
          />
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.productImage, { height: 240 }]}>
          <ProductImage produto={produto} size={72} />
        </View>

        <Text style={[styles.smallMuted, { marginTop: 20 }]}>
          {produto.marca} · Cód. {produto.codigo}
        </Text>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 20, lineHeight: 26, color: COLORS.dark, marginTop: 4, letterSpacing: -0.08 }}>
          {produto.nome}
        </Text>

        <View style={[styles.row, { gap: 4, marginTop: 4 }]}>
          <Stars nota={produto.avaliacao_media} />
          <Text style={styles.smallMuted}>
            {nota} ({produto.avaliacao_quantidade} {produto.avaliacao_quantidade === 1 ? 'avaliação' : 'avaliações'})
          </Text>
        </View>

        <View style={[styles.rowBetween, { marginTop: 12 }]}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 22, color: COLORS.dark, letterSpacing: -0.08 }}>
            {brl(produto.preco_centavos)}
          </Text>
          <View style={[styles.row, { gap: 6 }]}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.yellow }} />
            <Text style={styles.smallMuted}>Em estoque · {envio}</Text>
          </View>
        </View>

        <View style={[styles.cardOutline, { marginTop: 14 }]}>
          <InfoRow
            label="Compatível"
            value={compatValor}
            subtitle={compatSub}
            onPress={grupos.length > 0 ? () => setSheetCompat(true) : undefined}
          />
          <InfoRow label="Garantia" value={produto.garantia_meses > 0 ? produto.garantia_meses + ' meses de fábrica' : 'Sem garantia informada'} />
          <InfoRow label="Entrega" value={entrega} last />
        </View>

        {produto.descricao ? (
          <>
            <Text style={[styles.subTitle, { marginTop: 20 }]}>Descrição</Text>
            <Text style={[styles.mutedText, { lineHeight: 19, marginTop: 8 }]}>{produto.descricao}</Text>
          </>
        ) : null}

        {especificacoes.length > 0 ? (
          <>
            <Text style={[styles.subTitle, { marginTop: 20, marginBottom: 4 }]}>Especificações</Text>
            {especificacoes.map(function (e, i) {
              return (
                <View
                  key={e.nome + i}
                  style={[
                    styles.rowBetween,
                    { paddingVertical: 9, gap: 12 },
                    i < especificacoes.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.line },
                  ]}
                >
                  <Text style={[styles.mutedText, { fontSize: 13 }]}>{e.nome}</Text>
                  <Text style={[styles.body, { fontSize: 13, flexShrink: 1, textAlign: 'right' }]}>{e.valor}</Text>
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, styles.row, { gap: 12 }]}>
        <QtyStepper value={qtd} onChange={setQtd} disabled={busy} />
        <PrimaryButton
          label={busy ? 'Adicionando...' : 'Adicionar ao carrinho'}
          icon="shopping-cart"
          loading={busy}
          onPress={adicionar}
          style={styles.flex}
        />
      </View>

      <Sheet visible={sheetCompat} title="Veículos compatíveis" onClose={() => setSheetCompat(false)}>
        {vehicle ? (
          <View
            style={[
              styles.card,
              styles.row,
              { gap: 10, marginBottom: 12, backgroundColor: compativelComMeu ? COLORS.greenSoft : COLORS.redSoft },
            ]}
          >
            <MaterialCommunityIcons
              name={compativelComMeu ? 'check-circle-outline' : 'alert-circle-outline'}
              size={20}
              color={compativelComMeu ? COLORS.green : COLORS.red}
            />
            <Text style={[styles.body, styles.flex]}>
              {compativelComMeu ? 'Serve no seu ' + nomeVeiculo(vehicle) : 'Não consta como compatível com o seu ' + nomeVeiculo(vehicle)}
            </Text>
          </View>
        ) : null}
        {compativeis.map(function (v) {
          return (
            <SelectRow
              key={v.id_modelo_veiculo}
              icon="car-outline"
              iconFamily="mci"
              title={v.marca + ' ' + v.modelo}
              subtitle={String(v.ano)}
              active={vehicle && v.id_modelo_veiculo === vehicle.id_modelo_veiculo}
            />
          );
        })}
      </Sheet>
    </ScreenShell>
  );
}
