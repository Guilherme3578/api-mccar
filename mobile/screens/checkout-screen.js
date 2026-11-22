import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { COLORS, FONTS, styles } from '../styles/theme';
import {
  ScreenShell,
  TopBar,
  PrimaryButton,
  InfoRow,
  OrderSummary,
  ProductThumb,
  Sheet,
  SelectRow,
  Loading,
  ErrorState,
  EmptyState,
} from '../components/ui';
import { Field, FormMessage } from '../components/auth-form';
import AddressForm from '../components/address-form';
import { meuCarrinho, finalizarPedido } from '../services/shop';
import { listarEnderecos, listarCartoes } from '../services/account';
import { brl, enderecoTexto, mascaraCep, nomeBandeira, prazoTexto } from '../utils/format';

export function textoPreferencia(pref, cartoes) {
  if (!pref) return '';
  if (pref.metodo === 'MERCADO_PAGO') return 'Mercado Pago';
  if (pref.metodo === 'PIX') return 'Pix';
  if (pref.metodo === 'BOLETO') return 'Boleto bancário';
  const cartao = cartoes.find((c) => c.id_cartao === pref.id_cartao);
  if (cartao) return nomeBandeira(cartao.bandeira) + ' •••• ' + cartao.ultimos_quatro;
  return 'Novo cartão de crédito';
}

export default function Checkout({ go, back, refreshCart }) {
  const [carrinho, setCarrinho] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [enderecoId, setEnderecoId] = useState(null);
  const [preferencia, setPreferencia] = useState({ metodo: 'MERCADO_PAGO', id_cartao: null });
  const [cupomTexto, setCupomTexto] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState('');
  const [cupomErro, setCupomErro] = useState('');
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [novoEndereco, setNovoEndereco] = useState(false);

  const carregar = useCallback(async function () {
    setError('');
    try {
      const r = await Promise.all([meuCarrinho(), listarEnderecos(), listarCartoes().catch(() => [])]);
      setCarrinho(r[0]);
      setEnderecos(r[1]);
      setCartoes(r[2]);
      const principal = r[1].find((e) => e.principal === 1) || r[1][0];
      setEnderecoId(function (atual) {
        if (atual && r[1].some((e) => e.id_endereco === atual)) return atual;
        return principal ? principal.id_endereco : null;
      });
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(
    function () {
      carregar();
    },
    [carregar]
  );

  async function aplicarCupom() {
    const codigo = cupomTexto.trim().toUpperCase();
    if (!codigo) return setCupomErro('Digite um código.');
    setCupomErro('');
    setAplicando(true);
    try {
      setCarrinho(await meuCarrinho(codigo));
      setCupomAplicado(codigo);
      setSheet(null);
    } catch (e) {
      setCupomErro(e.message);
    } finally {
      setAplicando(false);
    }
  }

  async function removerCupom() {
    setCupomTexto('');
    setCupomAplicado('');
    setCupomErro('');
    try {
      setCarrinho(await meuCarrinho());
    } catch (e) {}
  }

  async function fazerPedido() {
    if (!enderecoId) {
      setSheet('endereco');
      return Alert.alert('Entrega', 'Escolha ou cadastre um endereço de entrega.');
    }
    setBusy(true);
    try {
      const idCupom = cupomAplicado && carrinho.cupom ? carrinho.cupom.id_cupom : null;
      const pedido = await finalizarPedido(enderecoId, idCupom);
      refreshCart();
      go('payment', { order: pedido, preference: preferencia }, { replace: true });
    } catch (e) {
      Alert.alert('Finalizar compra', e.message);
    } finally {
      setBusy(false);
    }
  }

  let corpo;
  if (error) {
    corpo = <ErrorState message={error} onRetry={carregar} />;
  } else if (!carrinho) {
    corpo = <Loading />;
  } else if (carrinho.itens.length === 0) {
    corpo = (
      <EmptyState
        icon="shopping-cart"
        title="Seu carrinho está vazio"
        action={<PrimaryButton label="Ver peças" onPress={() => go('catalog', {}, { reset: true })} />}
      />
    );
  }

  if (corpo) {
    return (
      <ScreenShell tabs={false}>
        <TopBar title="Finalizar compra" onBack={back} />
        {corpo}
      </ScreenShell>
    );
  }

  const endereco = enderecos.find((e) => e.id_endereco === enderecoId);
  const prazo = prazoTexto(carrinho.prazo_min_dias, carrinho.prazo_max_dias);

  return (
    <ScreenShell tabs={false}>
      <TopBar title="Finalizar compra" onBack={back} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.cardOutline}>
          <InfoRow
            icon="map-pin"
            label="Entrega"
            valueColumn={156}
            value={endereco ? enderecoTexto(endereco) : 'Adicionar endereço'}
            placeholder={!endereco}
            onPress={() => setSheet('endereco')}
          />
          <InfoRow
            icon="truck"
            label="Frete"
            valueColumn={156}
            value={carrinho.frete_centavos === 0 ? 'Grátis' : brl(carrinho.frete_centavos)}
            subtitle={'Padrão · ' + prazo}
            onPress={() => setSheet('frete')}
          />
          <InfoRow
            icon="credit-card"
            label="Pagamento"
            valueColumn={156}
            value={textoPreferencia(preferencia, cartoes)}
            subtitle={preferencia.metodo === 'MERCADO_PAGO' ? 'Cartão, Pix, boleto ou saldo' : 'No app · demonstração'}
            onPress={() => setSheet('pagamento')}
          />
          <InfoRow
            icon="tag"
            label="Promoções"
            valueColumn={156}
            value={cupomAplicado ? cupomAplicado + ' aplicado' : 'Aplicar código promocional'}
            subtitle={cupomAplicado && carrinho.desconto_centavos > 0 ? '- ' + brl(carrinho.desconto_centavos) : null}
            placeholder={!cupomAplicado}
            onPress={() => setSheet('cupom')}
            last
          />
        </View>

        <View style={[styles.cardOutline, { marginTop: 12 }]}>
          <View style={[styles.row, { height: 40, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.line }]}>
            <Text style={[styles.eyebrow, { width: 104 }]}>Itens</Text>
            <Text style={[styles.flex, { fontFamily: FONTS.medium, fontSize: 14, letterSpacing: 0.84, color: COLORS.dark, textTransform: 'uppercase' }]}>
              Descrição
            </Text>
            <Text style={styles.eyebrow}>Preço</Text>
          </View>
          {carrinho.itens.map(function (item) {
            return (
              <Pressable
                key={item.id_produto}
                onPress={() => go('detail', { productId: item.id_produto })}
                style={[styles.row, { gap: 12, alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12 }]}
              >
                <ProductThumb produto={item} size={56} iconSize={22} />
                <View style={styles.flex}>
                  <Text style={styles.smallMuted}>{item.marca}</Text>
                  <Text style={[styles.bodyMedium, { lineHeight: 18, marginTop: 2 }]} numberOfLines={2}>
                    {item.nome}
                  </Text>
                  <Text style={[styles.smallMuted, { marginTop: 2 }]}>Quantidade: {String(item.quantidade).padStart(2, '0')}</Text>
                </View>
                <Text style={styles.bodyStrong}>{brl(item.total_centavos)}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 16 }}>
          <OrderSummary
            resumo={carrinho}
            card={false}
            subtotalLabel={'Subtotal (' + carrinho.quantidade_itens + ')'}
            freteLabel="Total do frete"
          />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton label={busy ? 'Criando pedido...' : 'Fazer pedido'} loading={busy} onPress={fazerPedido} />
      </View>

      <Sheet
        visible={sheet === 'endereco'}
        title={novoEndereco ? 'Novo endereço' : 'Endereço de entrega'}
        onClose={function () {
          setSheet(null);
          setNovoEndereco(false);
        }}
      >
        {novoEndereco ? (
          <AddressForm
            principal={enderecos.length === 0}
            onCancel={() => setNovoEndereco(false)}
            onSaved={async function (criado) {
              setEnderecos(await listarEnderecos());
              setEnderecoId(criado.id_endereco);
              setNovoEndereco(false);
              setSheet(null);
            }}
          />
        ) : (
          <>
            {enderecos.map(function (e) {
              return (
                <SelectRow
                  key={e.id_endereco}
                  icon="map-pin"
                  active={e.id_endereco === enderecoId}
                  title={enderecoTexto(e)}
                  subtitle={e.bairro + ' · CEP ' + mascaraCep(e.cep)}
                  onPress={function () {
                    setEnderecoId(e.id_endereco);
                    setSheet(null);
                  }}
                />
              );
            })}
            <PrimaryButton label="Novo endereço" icon="plus" variant="secondary" onPress={() => setNovoEndereco(true)} />
          </>
        )}
      </Sheet>

      <Sheet visible={sheet === 'frete'} title="Frete" onClose={() => setSheet(null)}>
        <SelectRow
          icon="truck"
          active
          title={'Padrão · ' + (carrinho.frete_centavos === 0 ? 'Grátis' : brl(carrinho.frete_centavos))}
          subtitle={prazo}
        />
        <Text style={[styles.smallMuted, { marginBottom: 8 }]}>Frete grátis em compras a partir de R$ 100,00 em produtos.</Text>
      </Sheet>

      <Sheet visible={sheet === 'pagamento'} title="Forma de pagamento" onClose={() => setSheet(null)}>
        <SelectRow
          icon="handshake-outline"
          iconFamily="mci"
          active={preferencia.metodo === 'MERCADO_PAGO'}
          title="Mercado Pago"
          subtitle="Cartão, Pix, boleto ou saldo · recomendado"
          onPress={function () {
            setPreferencia({ metodo: 'MERCADO_PAGO', id_cartao: null });
            setSheet(null);
          }}
        />
        <Text style={[styles.eyebrow, { marginTop: 6, marginBottom: 10 }]}>No app · demonstração</Text>
        {cartoes.map(function (c) {
          return (
            <SelectRow
              key={c.id_cartao}
              icon="credit-card"
              active={preferencia.metodo === 'CARTAO' && preferencia.id_cartao === c.id_cartao}
              title={nomeBandeira(c.bandeira) + ' •••• ' + c.ultimos_quatro}
              subtitle={c.nome_titular}
              onPress={function () {
                setPreferencia({ metodo: 'CARTAO', id_cartao: c.id_cartao });
                setSheet(null);
              }}
            />
          );
        })}
        <SelectRow
          icon="plus"
          active={preferencia.metodo === 'CARTAO' && !preferencia.id_cartao}
          title="Novo cartão de crédito"
          onPress={function () {
            setPreferencia({ metodo: 'CARTAO', id_cartao: null });
            setSheet(null);
          }}
        />
        <SelectRow
          icon="rhombus-split-outline"
          iconFamily="mci"
          active={preferencia.metodo === 'PIX'}
          title="Pix"
          subtitle="Aprovação na hora"
          onPress={function () {
            setPreferencia({ metodo: 'PIX', id_cartao: null });
            setSheet(null);
          }}
        />
        <SelectRow
          icon="barcode"
          iconFamily="mci"
          active={preferencia.metodo === 'BOLETO'}
          title="Boleto bancário"
          subtitle="Compensação em até 3 dias úteis"
          onPress={function () {
            setPreferencia({ metodo: 'BOLETO', id_cartao: null });
            setSheet(null);
          }}
        />
      </Sheet>

      <Sheet visible={sheet === 'cupom'} title="Código promocional" onClose={() => setSheet(null)}>
        {cupomAplicado ? (
          <>
            <SelectRow icon="tag" active title={cupomAplicado} subtitle={'Desconto de ' + brl(carrinho.desconto_centavos)} right={null} />
            <PrimaryButton label="Remover cupom" variant="secondary" onPress={removerCupom} />
          </>
        ) : (
          <>
            <Field
              placeholder="Digite o código"
              value={cupomTexto}
              onChangeText={setCupomTexto}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={aplicarCupom}
              autoFocus
              style={{ marginTop: -12 }}
            />
            <FormMessage>{cupomErro}</FormMessage>
            <PrimaryButton label="Aplicar" loading={aplicando} onPress={aplicarCupom} style={{ marginTop: 16 }} />
          </>
        )}
      </Sheet>
    </ScreenShell>
  );
}
