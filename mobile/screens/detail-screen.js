import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { ScreenShell, TopBar, ProductImage, QtyStepper, PrimaryButton, Loading, ErrorState } from '../components/ui';
import { detalharProduto } from '../services/catalog';
import { brl } from '../utils/format';

function Estrelas({ nota }) {
  const cheias = Math.round(nota || 0);
  const itens = [];
  for (let i = 1; i <= 5; i++) {
    itens.push(<MaterialCommunityIcons key={i} name={i <= cheias ? 'star' : 'star-outline'} size={14} color={COLORS.yellow} />);
  }
  return <View style={styles.row}>{itens}</View>;
}

function Bloco({ titulo, children, aberto, onToggle }) {
  return (
    <View style={[styles.cardOutline, { marginTop: 10 }]}>
      <Pressable onPress={onToggle} style={[styles.rowBetween, { padding: 14 }]}>
        <Text style={styles.eyebrow}>{titulo}</Text>
        <Feather name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.muted} />
      </Pressable>
      {aberto ? <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>{children}</View> : null}
    </View>
  );
}

export default function Detail({
  go,
  back,
  productId,
  cartCount,
  openCart,
  favorites,
  toggleFavorite,
  addToCart,
  vehicle,
}) {
  const [produto, setProduto] = useState(null);
  const [error, setError] = useState('');
  const [qtd, setQtd] = useState(1);
  const [busy, setBusy] = useState(false);
  const [aberto, setAberto] = useState('compat');

  const carregar = useCallback(
    async function () {
      setError('');
      try {
        setProduto(await detalharProduto(productId));
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
        { text: 'Ver carrinho', onPress: () => go('cart') },
      ]);
    } catch (e) {
      Alert.alert('Carrinho', e.message);
    } finally {
      setBusy(false);
    }
  }

  function alternar(id) {
    setAberto(aberto === id ? '' : id);
  }

  if (!produto) {
    return (
      <ScreenShell active="catalog" go={go} cartCount={cartCount}>
        <TopBar title="Detalhes" onBack={back} cartCount={cartCount} openCart={openCart} />
        {error ? <ErrorState message={error} onRetry={carregar} /> : <Loading />}
      </ScreenShell>
    );
  }

  const favorito = favorites.includes(produto.id_produto);
  const compativeis = produto.veiculos_compativeis || [];
  const compativelComMeu = vehicle ? compativeis.some((v) => v.id_modelo_veiculo === vehicle.id_modelo_veiculo) : null;
  const prazoDias = Math.max(1, Math.ceil((produto.prazo_envio_horas || 0) / 24));
  const envio = produto.prazo_envio_horas <= 24 ? 'envio em 24h' : 'envio em até ' + prazoDias + ' dias';

  return (
    <ScreenShell active="catalog" go={go} cartCount={cartCount}>
      <TopBar
        title="Detalhes"
        onBack={back}
        right={
          <View style={styles.row}>
            <Pressable onPress={() => toggleFavorite(produto.id_produto)} style={styles.iconBtn}>
              <MaterialCommunityIcons
                name={favorito ? 'heart' : 'heart-outline'}
                size={24}
                color={favorito ? COLORS.red : COLORS.dark}
              />
            </Pressable>
            <Pressable onPress={openCart} style={styles.iconBtn}>
              <Feather name="shopping-cart" size={22} color={COLORS.dark} />
              {cartCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.productImage, { height: 240 }]}>
          <ProductImage produto={produto} size={96} />
        </View>

        <Text style={[styles.mutedText, { marginTop: 16 }]}>
          {produto.marca} · Cód. {produto.codigo}
        </Text>
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.dark, marginTop: 4 }}>{produto.nome}</Text>

        <View style={[styles.row, { gap: 6, marginTop: 8 }]}>
          <Estrelas nota={produto.avaliacao_media} />
          <Text style={styles.mutedText}>
            {produto.avaliacao_media ? String(produto.avaliacao_media).replace('.', ',') : '—'} ({produto.avaliacao_quantidade} avaliações)
          </Text>
        </View>

        <View style={[styles.rowBetween, { marginTop: 12 }]}>
          <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.dark }}>{brl(produto.preco_centavos)}</Text>
          <Text style={[styles.mutedText, { color: COLORS.green }]}>● Em estoque · {envio}</Text>
        </View>

        <Text style={[styles.body, { marginTop: 14, lineHeight: 20 }]}>{produto.descricao}</Text>

        {compativelComMeu !== null ? (
          <View
            style={[
              styles.card,
              { marginTop: 14, backgroundColor: compativelComMeu ? COLORS.greenSoft : '#FDE8E8', flexDirection: 'row', gap: 10, alignItems: 'center' },
            ]}
          >
            <Feather
              name={compativelComMeu ? 'check-circle' : 'alert-circle'}
              size={20}
              color={compativelComMeu ? COLORS.green : COLORS.red}
            />
            <Text style={[styles.body, { flex: 1 }]}>
              {compativelComMeu
                ? 'Compatível com o seu ' + vehicle.marca + ' ' + vehicle.modelo + ' ' + vehicle.ano
                : 'Não consta como compatível com o seu ' + vehicle.marca + ' ' + vehicle.modelo + ' ' + vehicle.ano}
            </Text>
          </View>
        ) : null}

        <Bloco titulo="COMPATÍVEL" aberto={aberto === 'compat'} onToggle={() => alternar('compat')}>
          {compativeis.length === 0 ? (
            <Text style={styles.mutedText}>Nenhum veículo informado.</Text>
          ) : (
            compativeis.map(function (v) {
              return (
                <Text key={v.id_modelo_veiculo} style={[styles.body, { marginTop: 4 }]}>
                  {v.marca} {v.modelo} {v.ano}
                </Text>
              );
            })
          )}
        </Bloco>

        <Bloco titulo="GARANTIA" aberto={aberto === 'garantia'} onToggle={() => alternar('garantia')}>
          <Text style={styles.body}>
            {produto.garantia_meses > 0 ? produto.garantia_meses + ' meses de fábrica' : 'Sem garantia informada'}
          </Text>
        </Bloco>

        <Bloco titulo="ENTREGA" aberto={aberto === 'entrega'} onToggle={() => alternar('entrega')}>
          <Text style={styles.body}>Separação e {envio}. O frete e o prazo final são calculados no carrinho.</Text>
        </Bloco>

        <Bloco titulo="ESPECIFICAÇÕES" aberto={aberto === 'espec'} onToggle={() => alternar('espec')}>
          {(produto.especificacoes || []).length === 0 ? (
            <Text style={styles.mutedText}>Sem especificações cadastradas.</Text>
          ) : (
            produto.especificacoes.map(function (e) {
              return (
                <View key={e.nome} style={[styles.rowBetween, { paddingVertical: 4 }]}>
                  <Text style={styles.mutedText}>{e.nome}</Text>
                  <Text style={[styles.body, { flexShrink: 1, textAlign: 'right' }]}>{e.valor}</Text>
                </View>
              );
            })
          )}
        </Bloco>
      </ScrollView>

      <View style={[styles.bottomBar, styles.row, { gap: 12 }]}>
        <QtyStepper value={qtd} onChange={setQtd} disabled={busy} />
        <View style={styles.flex}>
          <PrimaryButton
            label={busy ? 'Adicionando...' : 'Adicionar ao carrinho'}
            icon="shopping-cart"
            disabled={busy}
            onPress={adicionar}
          />
        </View>
      </View>
    </ScreenShell>
  );
}
