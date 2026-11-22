import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, styles } from '../styles/theme';
import { ScreenShell, TopBar, IconButton, PrimaryButton, InfoRow, Loading, ErrorState } from '../components/ui';
import { detalharPedido } from '../services/shop';
import { brl, enderecoTexto, prazoTexto, textoMetodo } from '../utils/format';

function textoPagamento(pedido) {
  const p = pedido.pagamento;
  if (!p) return 'Aguardando pagamento';
  return textoMetodo(p) + ' · ' + brl(p.valor_centavos);
}

const ESTADOS = {
  confirmado: {
    icone: 'check',
    titulo: 'Pedido confirmado',
    texto: 'Recebemos seu pedido e já iniciamos a\nseparação das peças.',
  },
  pendente: {
    icone: 'clock',
    titulo: 'Pedido recebido',
    texto: 'Assim que o pagamento for compensado,\niniciamos a separação das peças.',
  },
  recusado: {
    icone: 'x',
    titulo: 'Pagamento recusado',
    texto: 'Seu pedido foi criado, mas o pagamento não\nfoi aprovado. Tente pagar novamente.',
  },
};

export default function Confirmation({ go, orderId, refreshCart }) {
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

  const fechar = <IconButton icon="x" label="Fechar" onPress={() => go('home', {}, { reset: true })} />;

  if (!pedido) {
    return (
      <ScreenShell tabs={false}>
        <TopBar title="" right={fechar} />
        {error ? <ErrorState message={error} onRetry={carregar} /> : <Loading />}
      </ScreenShell>
    );
  }

  const statusPagamento = pedido.pagamento ? pedido.pagamento.status : 'PENDENTE';
  const chave = statusPagamento === 'RECUSADO' ? 'recusado' : statusPagamento === 'PENDENTE' ? 'pendente' : 'confirmado';
  const estado = ESTADOS[chave];
  const linhas = [
    ['Pedido', pedido.numero],
    ['Prazo', prazoTexto(pedido.prazo_min_dias, pedido.prazo_max_dias)],
    ['Entrega', enderecoTexto(pedido)],
    ['Pagamento', textoPagamento(pedido)],
  ];

  return (
    <ScreenShell tabs={false}>
      <TopBar title="" right={fechar} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: chave === 'recusado' ? COLORS.redSoft : COLORS.yellowSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name={estado.icone} size={30} color={chave === 'recusado' ? COLORS.red : COLORS.yellow} />
          </View>
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 24,
              lineHeight: 30,
              color: COLORS.dark,
              marginTop: 16,
              letterSpacing: -0.08,
              textAlign: 'center',
            }}
          >
            {estado.titulo}
          </Text>
          <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 6 }]}>{estado.texto}</Text>
        </View>

        <View style={[styles.cardOutline, { marginTop: 20 }]}>
          {linhas.map(function (linha, i) {
            return <InfoRow key={linha[0]} label={linha[0]} value={linha[1]} last={i === linhas.length - 1} />;
          })}
        </View>

        <View style={{ marginTop: 12, gap: 12 }}>
          {chave === 'recusado' ? (
            <PrimaryButton label="Tentar pagar novamente" onPress={() => go('payment', { order: pedido }, { replace: true })} />
          ) : (
            <PrimaryButton label="Acompanhar pedido" onPress={() => go('profile', { openOrder: pedido.id_pedido }, { reset: true })} />
          )}
          <PrimaryButton label="Voltar ao início" variant="secondary" onPress={() => go('home', {}, { reset: true })} />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
