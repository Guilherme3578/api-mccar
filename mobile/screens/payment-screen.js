import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { ScreenShell, TopBar, PrimaryButton, Pill, SelectRow, SummaryLine, EmptyState } from '../components/ui';
import { Field, FormMessage } from '../components/auth-form';
import { pagar, cancelarPedido } from '../services/shop';
import { listarCartoes } from '../services/account';
import { brl, bandeiraPorNumero, mascaraCartao, mascaraValidade, validadeOk } from '../utils/format';

const METODOS = [
  { id: 'CARTAO', label: 'Cartão', icon: 'credit-card' },
  { id: 'PIX', label: 'Pix', icon: 'zap' },
  { id: 'BOLETO', label: 'Boleto', icon: 'file-text' },
];

export default function Payment({ go, back, order, cartCount, openCart, refreshCart }) {
  const [metodo, setMetodo] = useState('CARTAO');
  const [cartoes, setCartoes] = useState([]);
  const [cartaoId, setCartaoId] = useState(null);
  const [outroCartao, setOutroCartao] = useState(false);
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [salvar, setSalvar] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(function () {
    listarCartoes()
      .then(function (lista) {
        setCartoes(lista);
        const principal = lista.find((c) => c.principal === 1) || lista[0];
        if (principal) {
          setCartaoId(principal.id_cartao);
        } else {
          setOutroCartao(true);
        }
      })
      .catch(function () {
        setOutroCartao(true);
      });
  }, []);

  if (!order) {
    return (
      <ScreenShell active="cart" go={go} cartCount={cartCount}>
        <TopBar title="Pagamento" onBack={back} />
        <EmptyState icon="alert-circle" title="Pedido não encontrado" action={<PrimaryButton label="Voltar ao carrinho" onPress={() => go('cart')} />} />
      </ScreenShell>
    );
  }

  function montarPagamento() {
    const dados = { id_pedido: order.id_pedido, metodo: metodo };
    if (metodo !== 'CARTAO') return dados;

    if (!outroCartao && cartaoId) {
      dados.id_cartao = cartaoId;
      return dados;
    }

    const digitos = numero.replace(/\D/g, '');
    if (digitos.length < 13 || digitos.length > 16) throw new Error('Número do cartão inválido.');
    if (nome.trim().length < 3) throw new Error('Informe o nome impresso no cartão.');
    if (!validadeOk(validade)) throw new Error('Validade inválida ou vencida (use MM/AA).');
    if (!/^\d{3,4}$/.test(cvv)) throw new Error('CVV inválido.');

    dados.cartao = {
      bandeira: bandeiraPorNumero(digitos),
      ultimos_quatro: digitos.slice(-4),
      nome_titular: nome.trim().toUpperCase(),
    };
    dados.salvar_cartao = salvar;
    return dados;
  }

  async function confirmar() {
    setError('');
    let dados;
    try {
      dados = montarPagamento();
    } catch (e) {
      return setError(e.message);
    }
    setBusy(true);
    try {
      await pagar(dados);
      go('confirmation', { orderId: order.id_pedido });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  function cancelar() {
    Alert.alert('Cancelar pedido', 'Deseja cancelar este pedido?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: async function () {
          try {
            await cancelarPedido(order.id_pedido);
            refreshCart();
            go('home');
          } catch (e) {
            Alert.alert('Pedido', e.message);
          }
        },
      },
    ]);
  }

  return (
    <ScreenShell active="cart" go={go} cartCount={cartCount}>
      <TopBar title="Pagamento" onBack={back} cartCount={cartCount} openCart={openCart} />
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.row, { gap: 8 }]}>
          {METODOS.map(function (m) {
            return <Pill key={m.id} label={m.label} icon={m.icon} active={metodo === m.id} onPress={() => setMetodo(m.id)} />;
          })}
        </View>

        {metodo === 'CARTAO' ? (
          <View style={{ marginTop: 14 }}>
            {cartoes.length > 0 ? (
              <>
                <Text style={styles.fieldLabel}>Cartões salvos</Text>
                {cartoes.map(function (c) {
                  return (
                    <SelectRow
                      key={c.id_cartao}
                      icon="credit-card"
                      active={!outroCartao && cartaoId === c.id_cartao}
                      title={c.bandeira + ' •••• ' + c.ultimos_quatro}
                      subtitle={c.nome_titular}
                      onPress={function () {
                        setOutroCartao(false);
                        setCartaoId(c.id_cartao);
                      }}
                    />
                  );
                })}
                <SelectRow icon="plus" active={outroCartao} title="Usar outro cartão" onPress={() => setOutroCartao(true)} />
              </>
            ) : null}

            {outroCartao ? (
              <>
                <Field
                  label="Número do cartão"
                  placeholder="0000 0000 0000 0000"
                  keyboardType="number-pad"
                  value={numero}
                  onChangeText={(t) => setNumero(mascaraCartao(t))}
                />
                <Field
                  label="Nome impresso no cartão"
                  placeholder="NOME COMPLETO"
                  autoCapitalize="characters"
                  value={nome}
                  onChangeText={setNome}
                />
                <View style={[styles.row, { gap: 10 }]}>
                  <View style={styles.flex}>
                    <Field
                      label="Validade"
                      placeholder="MM/AA"
                      keyboardType="number-pad"
                      value={validade}
                      onChangeText={(t) => setValidade(mascaraValidade(t))}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Field
                      label="CVV"
                      placeholder="123"
                      keyboardType="number-pad"
                      secret
                      maxLength={4}
                      value={cvv}
                      onChangeText={(t) => setCvv(t.replace(/\D/g, ''))}
                    />
                  </View>
                </View>
                <View style={[styles.rowBetween, { marginTop: 14 }]}>
                  <Text style={styles.body}>Salvar cartão para próximas compras</Text>
                  <Switch
                    value={salvar}
                    onValueChange={setSalvar}
                    trackColor={{ false: COLORS.line, true: COLORS.yellow }}
                    thumbColor={COLORS.white}
                  />
                </View>
                <Text style={[styles.mutedText, { marginTop: 6 }]}>
                  Por segurança, só enviamos a bandeira, os 4 últimos dígitos e o nome. O número completo e o CVV nunca saem do aparelho.
                </Text>
              </>
            ) : null}
          </View>
        ) : null}

        {metodo === 'PIX' ? (
          <View style={[styles.card, { marginTop: 14 }]}>
            <Text style={[styles.body, { fontWeight: '800' }]}>Pagamento por Pix (simulado)</Text>
            <Text style={[styles.mutedText, { marginTop: 6 }]}>
              Ao confirmar, o pagamento é registrado e aprovado na hora, sem integração com banco real.
            </Text>
          </View>
        ) : null}

        {metodo === 'BOLETO' ? (
          <View style={[styles.card, { marginTop: 14 }]}>
            <Text style={[styles.body, { fontWeight: '800' }]}>Boleto bancário (simulado)</Text>
            <Text style={[styles.mutedText, { marginTop: 6 }]}>
              O pedido fica aguardando a confirmação do pagamento. A compensação do boleto leva até 3 dias úteis.
            </Text>
          </View>
        ) : null}

        <FormMessage>{error}</FormMessage>

        <View style={{ marginTop: 16 }} />
        <View style={styles.card}>
          <SummaryLine label="Pedido" value={order.numero} />
          <SummaryLine label="Subtotal" value={brl(order.subtotal_centavos)} />
          {order.desconto_centavos > 0 ? (
            <SummaryLine label="Desconto" value={'- ' + brl(order.desconto_centavos)} green />
          ) : null}
          <SummaryLine label="Frete estimado" value={order.frete_centavos === 0 ? 'Grátis' : brl(order.frete_centavos)} />
          <View style={styles.divider} />
          <SummaryLine label="Total" value={brl(order.total_centavos)} total />
        </View>

        <View style={{ marginTop: 12 }}>
          <PrimaryButton label="Cancelar pedido" variant="secondary" onPress={cancelar} disabled={busy} />
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <PrimaryButton
          icon="shield"
          label={busy ? 'Processando...' : 'Confirmar pagamento'}
          disabled={busy}
          onPress={confirmar}
        />
      </View>
    </ScreenShell>
  );
}
