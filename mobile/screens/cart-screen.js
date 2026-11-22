import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { ScreenShell, ProductThumb, QtyStepper, PrimaryButton, OrderSummary, Loading, ErrorState, EmptyState } from '../components/ui';
import { meuCarrinho, alterarQuantidade, removerItem } from '../services/shop';
import { brl, brlCurto } from '../utils/format';

const FRETE_GRATIS_ACIMA = 10000;

export default function Cart({ go, cartCount, refreshCart }) {
  const [carrinho, setCarrinho] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(
    async function () {
      setError('');
      try {
        setCarrinho(await meuCarrinho());
        refreshCart();
      } catch (e) {
        setError(e.message);
      } finally {
        setRefreshing(false);
      }
    },
    [refreshCart]
  );

  useEffect(
    function () {
      carregar();
    },
    [carregar]
  );

  async function mudar(item, quantidade) {
    setBusyId(item.id_produto);
    try {
      await alterarQuantidade(carrinho.id_carrinho, item.id_produto, quantidade);
      await carregar();
    } catch (e) {
      Alert.alert('Carrinho', e.message);
    } finally {
      setBusyId(null);
    }
  }

  function remover(item) {
    Alert.alert('Remover item', 'Remover "' + item.nome + '" do carrinho?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async function () {
          setBusyId(item.id_produto);
          try {
            await removerItem(carrinho.id_carrinho, item.id_produto);
            await carregar();
          } catch (e) {
            Alert.alert('Carrinho', e.message);
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }

  let conteudo;
  if (error) {
    conteudo = <ErrorState message={error} onRetry={carregar} />;
  } else if (!carrinho) {
    conteudo = <Loading />;
  } else if (carrinho.itens.length === 0) {
    conteudo = (
      <EmptyState
        icon="shopping-cart"
        title="Seu carrinho está vazio"
        subtitle="Encontre peças compatíveis com o seu veículo."
        action={<PrimaryButton label="Ver peças" onPress={() => go('catalog', {}, { reset: true })} />}
      />
    );
  } else {
    const itens = carrinho.itens;
    const faltaFrete = FRETE_GRATIS_ACIMA - (carrinho.subtotal_centavos - carrinho.desconto_centavos);
    conteudo = (
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={COLORS.yellow}
            colors={[COLORS.yellow]}
            onRefresh={function () {
              setRefreshing(true);
              carregar();
            }}
          />
        }
      >
        {itens.map(function (item, i) {
          const ocupado = busyId === item.id_produto;
          return (
            <View
              key={item.id_produto}
              style={[
                styles.row,
                { gap: 12, alignItems: 'flex-start', paddingVertical: 14 },
                i < itens.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.line },
              ]}
            >
              <Pressable onPress={() => go('detail', { productId: item.id_produto })} style={{ marginTop: 4 }}>
                <ProductThumb produto={item} />
              </Pressable>
              <View style={styles.flex}>
                <View style={[styles.row, { alignItems: 'flex-start', gap: 8 }]}>
                  <Pressable style={styles.flex} onPress={() => go('detail', { productId: item.id_produto })}>
                    <Text style={[styles.bodyMedium, { lineHeight: 18 }]} numberOfLines={2}>
                      {item.nome}
                    </Text>
                    <Text style={[styles.smallMuted, { marginTop: 2 }]}>{item.marca}</Text>
                  </Pressable>
                  <Pressable onPress={() => remover(item)} hitSlop={10} disabled={ocupado} accessibilityLabel="Remover item">
                    <Feather name="trash-2" size={18} color={COLORS.muted} />
                  </Pressable>
                </View>
                <View style={[styles.rowBetween, { marginTop: 8 }]}>
                  <QtyStepper
                    size="sm"
                    value={item.quantidade}
                    disabled={ocupado}
                    min={0}
                    onChange={(q) => (q < 1 ? remover(item) : mudar(item, q))}
                  />
                  <Text style={styles.bodyStrong}>{brl(item.total_centavos)}</Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ marginTop: 4 }}>
          <OrderSummary resumo={carrinho} />
        </View>
        {faltaFrete > 0 && carrinho.frete_centavos > 0 ? (
          <Text style={[styles.smallMuted, { marginTop: 10, textAlign: 'center' }]}>
            Faltam {brl(faltaFrete)} para frete grátis (acima de {brlCurto(FRETE_GRATIS_ACIMA)}).
          </Text>
        ) : null}

        <PrimaryButton label="Finalizar compra" onPress={() => go('checkout')} style={{ marginTop: 12 }} />
      </ScrollView>
    );
  }

  const qtd = carrinho ? carrinho.quantidade_itens : 0;

  return (
    <ScreenShell active="cart" go={go} cartCount={cartCount}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
        <Text style={styles.pageTitle}>Carrinho</Text>
        {carrinho && qtd > 0 ? (
          <Text style={[styles.mutedText, { marginTop: 2 }]}>{qtd === 1 ? '1 item' : qtd + ' itens'}</Text>
        ) : null}
      </View>
      {conteudo}
    </ScreenShell>
  );
}
