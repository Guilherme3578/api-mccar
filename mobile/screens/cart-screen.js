import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { ScreenShell, ProductImage, QtyStepper, PrimaryButton, OrderSummary, Logo, CartButton, Loading, ErrorState, EmptyState } from '../components/ui';
import { meuCarrinho, alterarQuantidade, removerItem } from '../services/shop';
import { brl, prazoTexto } from '../utils/format';

export default function Cart({ go, cartCount, refreshCart }) {
  const [carrinho, setCarrinho] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const carregar = useCallback(
    async function () {
      setError('');
      try {
        setCarrinho(await meuCarrinho());
        refreshCart();
      } catch (e) {
        setError(e.message);
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
        action={<PrimaryButton label="Ver peças" onPress={() => go('catalog')} />}
      />
    );
  } else {
    const itens = carrinho.itens;
    conteudo = (
      <>
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          <Text style={[styles.mutedText, { marginBottom: 10 }]}>
            {carrinho.quantidade_itens === 1 ? '1 item' : carrinho.quantidade_itens + ' itens'}
          </Text>
          {itens.map(function (item) {
            return (
              <View key={item.id_produto} style={styles.cartItem}>
                <Pressable style={styles.cartThumb} onPress={() => go('detail', { productId: item.id_produto })}>
                  <ProductImage produto={item} size={34} />
                </Pressable>
                <View style={styles.flex}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.mutedText, { flex: 1 }]}>{item.marca}</Text>
                    <Pressable onPress={() => remover(item)} hitSlop={10}>
                      <Feather name="trash-2" size={18} color={COLORS.red} />
                    </Pressable>
                  </View>
                  <Text style={[styles.body, { fontWeight: '800' }]} numberOfLines={2}>
                    {item.nome}
                  </Text>
                  <View style={[styles.rowBetween, { marginTop: 8 }]}>
                    <QtyStepper
                      value={item.quantidade}
                      disabled={busyId === item.id_produto}
                      onChange={(q) => mudar(item, q)}
                    />
                    <Text style={{ fontWeight: '900', color: COLORS.dark }}>{brl(item.total_centavos)}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={{ marginTop: 6 }}>
            <OrderSummary carrinho={carrinho} />
          </View>
          {carrinho.prazo_max_dias > 0 ? (
            <Text style={[styles.mutedText, { marginTop: 10 }]}>
              Prazo estimado: {prazoTexto(carrinho.prazo_min_dias, carrinho.prazo_max_dias)}
            </Text>
          ) : null}
          {carrinho.frete_centavos > 0 ? (
            <Text style={[styles.mutedText, { marginTop: 4 }]}>
              Frete grátis em compras a partir de R$ 100,00 em produtos.
            </Text>
          ) : null}
        </ScrollView>
        <View style={styles.bottomBar}>
          <PrimaryButton label="Finalizar compra" onPress={() => go('checkout')} />
        </View>
      </>
    );
  }

  return (
    <ScreenShell active="cart" go={go} cartCount={cartCount}>
      <View style={styles.header}>
        <View style={[styles.row, { gap: 16 }]}>
          <Logo />
          <Text style={styles.topTitle}>Carrinho</Text>
        </View>
        <CartButton count={cartCount} onPress={carregar} />
      </View>
      {conteudo}
    </ScreenShell>
  );
}
