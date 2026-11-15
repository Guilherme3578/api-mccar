import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { ScreenShell, PrimaryButton, Loading, ErrorState, StatusPill } from '../components/ui';
import { detalharPedido } from '../services/shop';
import { brl, enderecoTexto, prazoTexto } from '../utils/format';

function textoPagamento(pedido) {
  const p = pedido.pagamento;
  if (!p) return 'Aguardando pagamento';
  const valor = brl(p.valor_centavos);
  if (p.metodo === 'CARTAO') {
    const bandeira = p.cartao_bandeira ? p.cartao_bandeira.charAt(0) + p.cartao_bandeira.slice(1).toLowerCase() : 'Cartão';
    return bandeira + ' •••• ' + p.cartao_final + ' · ' + valor;
  }
  return (p.metodo === 'PIX' ? 'Pix' : 'Boleto') + ' · ' + valor;
}

export default function Confirmation({ go, cartCount, orderId, refreshCart }) {
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState('');

  const carregar = useCallback(
    async function () {
      setError('');
      try {
        setPedido(await detalharPedido(orderId));
        refreshCart();
      } catch (e) {
        setError(e.message);
      }
    },
    [orderId, refreshCart]
  );

  useEffect(
    function () {
      carregar();
    },
    [carregar]
  );

  if (error) {
    return (
      <ScreenShell active="cart" go={go} cartCount={cartCount}>
        <ErrorState message={error} onRetry={carregar} />
      </ScreenShell>
    );
  }
  if (!pedido) {
    return (
      <ScreenShell active="cart" go={go} cartCount={cartCount}>
        <Loading />
      </ScreenShell>
    );
  }

  const pendente = pedido.pagamento && pedido.pagamento.status === 'PENDENTE';
  const linhas = [
    ['PEDIDO', pedido.numero],
    ['PRAZO', prazoTexto(pedido.prazo_min_dias, pedido.prazo_max_dias)],
    ['ENTREGA', enderecoTexto(pedido)],
    ['PAGAMENTO', textoPagamento(pedido)],
  ];

  return (
    <ScreenShell active="cart" go={go} cartCount={cartCount}>
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: COLORS.yellowSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
          }}
        >
          <Feather name={pendente ? 'clock' : 'check'} size={34} color={COLORS.yellow} />
        </View>
        <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.dark, marginTop: 16 }}>
          {pendente ? 'Pedido recebido' : 'Pedido confirmado'}
        </Text>
        <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 6, marginBottom: 12 }]}>
          {pendente
            ? 'Assim que o pagamento for compensado, iniciamos a separação das peças.'
            : 'Recebemos seu pedido e já iniciamos a separação das peças.'}
        </Text>
        <StatusPill status={pedido.status} />

        <View style={[styles.cardOutline, { alignSelf: 'stretch', marginTop: 20 }]}>
          {linhas.map(function (linha, i) {
            return (
              <View key={linha[0]} style={[styles.infoRow, i === linhas.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>{linha[0]}</Text>
                <Text style={styles.infoValue}>{linha[1]}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ alignSelf: 'stretch', marginTop: 24, gap: 10 }}>
          <PrimaryButton label="Acompanhar pedido" onPress={() => go('profile')} />
          <PrimaryButton label="Voltar ao início" variant="secondary" onPress={() => go('home')} />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
