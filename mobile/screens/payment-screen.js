import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, FONTS, styles } from '../styles/theme';
import { ScreenShell, TopBar, PrimaryButton, SelectRow, OrderSummary, Toggle, EmptyState } from '../components/ui';
import { Field, FormMessage } from '../components/auth-form';
import { pagar, iniciarMercadoPago, sincronizarMercadoPago } from '../services/shop';
import { listarCartoes } from '../services/account';
import { bandeiraPorNumero, mascaraCartao, mascaraValidade, nomeBandeira, validadeOk } from '../utils/format';

const METODOS = [
  { id: 'CARTAO', label: 'Cartão', icon: 'credit-card-outline' },
  { id: 'PIX', label: 'Pix', icon: 'rhombus-split-outline' },
  { id: 'BOLETO', label: 'Boleto', icon: 'barcode' },
];

export function resultadoMercadoPago(resposta) {
  const pagamento = (resposta && resposta.pagamento) || {};
  const statusPedido = resposta && resposta.status_pedido;
  if (statusPedido === 'PAGO' || pagamento.status === 'APROVADO') return 'aprovado';
  if (pagamento.status === 'RECUSADO') return 'recusado';
  if (pagamento.status === 'PENDENTE' && pagamento.metodo && pagamento.metodo !== 'MERCADO_PAGO') return 'pendente';
  return 'aguardando';
}

function Segmented({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: COLORS.field, borderRadius: 12, padding: 4, height: 44 }}>
      {METODOS.map(function (m) {
        const ativo = m.id === value;
        return (
          <Pressable
            key={m.id}
            onPress={() => onChange(m.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            style={[
              styles.flex,
              styles.row,
              { justifyContent: 'center', gap: 6, borderRadius: 9 },
              ativo && {
                backgroundColor: COLORS.white,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 1,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              },
            ]}
          >
            <MaterialCommunityIcons name={m.icon} size={18} color={ativo ? COLORS.dark : COLORS.muted} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: ativo ? COLORS.dark : COLORS.muted }}>{m.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function OpcaoModo({ ativo, titulo, subtitulo, icone, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.selectRow, ativo && styles.selectRowActive]} accessibilityRole="radio" accessibilityState={{ checked: ativo }}>
      <MaterialCommunityIcons name={icone} size={22} color={COLORS.yellow} />
      <View style={styles.flex}>
        <Text style={styles.bodyMedium}>{titulo}</Text>
        <Text style={[styles.smallMuted, { marginTop: 2 }]}>{subtitulo}</Text>
      </View>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: ativo ? COLORS.dark : COLORS.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ativo ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.dark }} /> : null}
      </View>
    </Pressable>
  );
}

function Aviso({ titulo, texto, icone, cor = COLORS.field }) {
  return (
    <View style={[styles.card, { marginTop: 16, backgroundColor: cor, flexDirection: 'row', gap: 10 }]}>
      {icone ? <Feather name={icone} size={20} color={COLORS.dark} style={{ marginTop: 1 }} /> : null}
      <View style={styles.flex}>
        <Text style={styles.bodyStrong}>{titulo}</Text>
        <Text style={[styles.mutedText, { marginTop: 4 }]}>{texto}</Text>
      </View>
    </View>
  );
}

export default function Payment({ go, back, order, preference }) {
  const inicial = preference || { metodo: 'MERCADO_PAGO', id_cartao: null };
  const [modo, setModo] = useState(inicial.metodo === 'MERCADO_PAGO' ? 'mp' : 'app');
  const [metodo, setMetodo] = useState(inicial.metodo === 'MERCADO_PAGO' ? 'CARTAO' : inicial.metodo);
  const [cartoes, setCartoes] = useState([]);
  const [cartaoId, setCartaoId] = useState(inicial.id_cartao);
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [salvar, setSalvar] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [aguardandoMp, setAguardandoMp] = useState(false);
  const checkoutUrl = useRef(null);

  useEffect(function () {
    listarCartoes()
      .then(setCartoes)
      .catch(function () {});
  }, []);

  if (!order) {
    return (
      <ScreenShell tabs={false}>
        <TopBar title="Pagamento" onBack={back} />
        <EmptyState
          icon="alert-circle"
          title="Pedido não encontrado"
          action={<PrimaryButton label="Voltar ao carrinho" onPress={() => go('cart', {}, { reset: true })} />}
        />
      </ScreenShell>
    );
  }

  const usandoSalvo = metodo === 'CARTAO' && cartaoId && cartoes.some((c) => c.id_cartao === cartaoId);

  function montarPagamento() {
    const dados = { id_pedido: order.id_pedido, metodo: metodo };
    if (metodo !== 'CARTAO') return dados;
    if (usandoSalvo) {
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

  async function verificarMercadoPago() {
    setBusy(true);
    setError('');
    try {
      const resposta = await sincronizarMercadoPago(order.id_pedido);
      const situacao = resultadoMercadoPago(resposta);
      if (situacao === 'aprovado' || situacao === 'pendente') {
        go('confirmation', { orderId: order.id_pedido }, { replace: true });
        return;
      }
      setAguardandoMp(true);
      setError(
        situacao === 'recusado'
          ? 'O Mercado Pago recusou o pagamento. Tente de novo com outra forma de pagamento.'
          : 'Ainda não recebemos a confirmação do Mercado Pago. Se você já pagou, toque em "Já paguei, verificar".'
      );
    } catch (e) {
      setAguardandoMp(true);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function pagarComMercadoPago() {
    setBusy(true);
    setError('');
    try {
      if (!checkoutUrl.current) {
        const resposta = await iniciarMercadoPago(order.id_pedido);
        checkoutUrl.current = resposta.checkout_url || resposta.sandbox_checkout_url;
      }
      if (!checkoutUrl.current) throw new Error('O Mercado Pago não devolveu o link de pagamento.');
      await WebBrowser.openBrowserAsync(checkoutUrl.current, { toolbarColor: COLORS.white, controlsColor: COLORS.dark });
    } catch (e) {
      setBusy(false);
      checkoutUrl.current = null;
      setError(
        e.status === 503 ? 'O Mercado Pago não está configurado no servidor. Use o pagamento no app (demonstração).' : e.message
      );
      return;
    }
    await verificarMercadoPago();
  }

  async function confirmarNoApp() {
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
      go('confirmation', { orderId: order.id_pedido }, { replace: true });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  let rotuloBotao = 'Confirmar pagamento';
  if (modo === 'mp') rotuloBotao = aguardandoMp ? 'Abrir Mercado Pago de novo' : 'Pagar com Mercado Pago';
  if (busy) rotuloBotao = modo === 'mp' ? 'Aguardando Mercado Pago...' : 'Processando...';

  return (
    <ScreenShell tabs={false}>
      <TopBar title="Pagamento" onBack={back} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OpcaoModo
          ativo={modo === 'mp'}
          icone="handshake-outline"
          titulo="Mercado Pago"
          subtitulo="Cartão, Pix, boleto ou saldo, no ambiente seguro do Mercado Pago"
          onPress={function () {
            setModo('mp');
            setError('');
          }}
        />
        <OpcaoModo
          ativo={modo === 'app'}
          icone="cellphone"
          titulo="Pagar no app"
          subtitulo="Cartão, Pix ou boleto (ambiente de demonstração)"
          onPress={function () {
            setModo('app');
            setError('');
          }}
        />

        {modo === 'mp' ? (
          <Aviso
            icone="lock"
            titulo={aguardandoMp ? 'Aguardando confirmação' : 'Você vai para o Mercado Pago'}
            texto={
              aguardandoMp
                ? 'Conclua o pagamento na página do Mercado Pago. Depois, volte ao app para confirmarmos.'
                : 'Ao continuar, abrimos a página de pagamento do Mercado Pago. Os dados do seu cartão não passam pelo app.'
            }
          />
        ) : (
          <View style={{ marginTop: 6 }}>
            <Segmented
              value={metodo}
              onChange={function (m) {
                setMetodo(m);
                setError('');
              }}
            />

            {metodo === 'CARTAO' ? (
              <View>
                {cartoes.length > 0 ? (
                  <View style={{ marginTop: 16 }}>
                    {cartoes.map(function (c) {
                      return (
                        <SelectRow
                          key={c.id_cartao}
                          icon="credit-card"
                          active={cartaoId === c.id_cartao}
                          title={nomeBandeira(c.bandeira) + ' •••• ' + c.ultimos_quatro}
                          subtitle={c.nome_titular}
                          onPress={() => setCartaoId(c.id_cartao)}
                        />
                      );
                    })}
                    <SelectRow icon="plus" active={!usandoSalvo} title="Usar outro cartão" onPress={() => setCartaoId(null)} />
                  </View>
                ) : null}

                {!usandoSalvo ? (
                  <>
                    <Field
                      label="Número do cartão"
                      placeholder="0000 0000 0000 0000"
                      keyboardType="number-pad"
                      value={numero}
                      onChangeText={(t) => setNumero(mascaraCartao(t))}
                      style={{ marginTop: 4 }}
                    />
                    <Field
                      label="Nome impresso no cartão"
                      placeholder="NOME COMPLETO"
                      autoCapitalize="characters"
                      value={nome}
                      onChangeText={(t) => setNome(t.toUpperCase())}
                    />
                    <View style={[styles.row, { gap: 12 }]}>
                      <Field
                        label="Validade"
                        placeholder="MM/AA"
                        keyboardType="number-pad"
                        value={validade}
                        onChangeText={(t) => setValidade(mascaraValidade(t))}
                        style={styles.flex}
                      />
                      <Field
                        label="CVV"
                        placeholder="123"
                        keyboardType="number-pad"
                        secret
                        maxLength={4}
                        value={cvv}
                        onChangeText={(t) => setCvv(t.replace(/\D/g, ''))}
                        style={styles.flex}
                      />
                    </View>
                    <View style={[styles.rowBetween, { marginTop: 18, gap: 12 }]}>
                      <Text style={[styles.bodyMedium, styles.flex]}>Salvar cartão para próximas compras</Text>
                      <Toggle value={salvar} onChange={setSalvar} />
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}

            {metodo === 'PIX' ? (
              <Aviso titulo="Pagamento por Pix" texto="Ao confirmar, o pagamento é registrado e aprovado na hora. Ambiente de demonstração, sem cobrança real." />
            ) : null}

            {metodo === 'BOLETO' ? (
              <Aviso
                titulo="Boleto bancário"
                texto="O pedido fica aguardando a confirmação do pagamento. A compensação do boleto leva até 3 dias úteis."
              />
            ) : null}
          </View>
        )}

        <FormMessage>{error}</FormMessage>

        <View style={{ marginTop: 16 }}>
          <OrderSummary resumo={order} freteLabel="Frete" />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { gap: 10 }]}>
        {modo === 'mp' && aguardandoMp ? (
          <PrimaryButton label="Já paguei, verificar" variant="secondary" disabled={busy} onPress={verificarMercadoPago} />
        ) : null}
        <PrimaryButton
          icon="shield"
          label={rotuloBotao}
          loading={busy}
          onPress={modo === 'mp' ? pagarComMercadoPago : confirmarNoApp}
        />
      </View>
    </ScreenShell>
  );
}
