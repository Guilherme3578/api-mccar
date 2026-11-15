import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import {
  ScreenShell,
  TopBar,
  PrimaryButton,
  OrderSummary,
  Sheet,
  SelectRow,
  Loading,
  ErrorState,
  EmptyState,
  ProductImage,
} from '../components/ui';
import { Field, FormMessage } from '../components/auth-form';
import { meuCarrinho, finalizarPedido } from '../services/shop';
import { listarEnderecos, criarEndereco } from '../services/account';
import { brl, enderecoTexto, mascaraCep, prazoTexto } from '../utils/format';

const VAZIO = { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '' };

export default function Checkout({ go, back, cartCount, openCart, refreshCart }) {
  const [carrinho, setCarrinho] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoId, setEnderecoId] = useState(null);
  const [cupomTexto, setCupomTexto] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState('');
  const [cupomErro, setCupomErro] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [menuEndereco, setMenuEndereco] = useState(false);
  const [novo, setNovo] = useState(VAZIO);
  const [formEndereco, setFormEndereco] = useState(false);
  const [erroEndereco, setErroEndereco] = useState('');
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);

  const carregar = useCallback(async function () {
    setError('');
    try {
      const resultados = await Promise.all([meuCarrinho(), listarEnderecos()]);
      setCarrinho(resultados[0]);
      setEnderecos(resultados[1]);
      const principal = resultados[1].find((e) => e.principal === 1) || resultados[1][0];
      setEnderecoId(function (atual) {
        if (atual && resultados[1].some((e) => e.id_endereco === atual)) return atual;
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
    if (!codigo) {
      setCupomAplicado('');
      setCupomErro('');
      setCarrinho(await meuCarrinho());
      return;
    }
    setCupomErro('');
    try {
      const resumo = await meuCarrinho(codigo);
      setCarrinho(resumo);
      setCupomAplicado(codigo);
    } catch (e) {
      setCupomAplicado('');
      setCupomErro(e.message);
      try {
        setCarrinho(await meuCarrinho());
      } catch (e2) {}
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

  async function salvarEndereco() {
    const e = novo;
    if (!e.logradouro.trim() || !e.numero.trim() || !e.bairro.trim() || !e.cidade.trim()) {
      return setErroEndereco('Preencha rua, número, bairro e cidade.');
    }
    if (e.uf.trim().length !== 2) return setErroEndereco('UF deve ter 2 letras.');
    if (e.cep.replace(/\D/g, '').length !== 8) return setErroEndereco('CEP deve ter 8 dígitos.');
    setSalvandoEndereco(true);
    setErroEndereco('');
    try {
      const criado = await criarEndereco({ ...e, principal: enderecos.length === 0 ? 1 : 0 });
      const lista = await listarEnderecos();
      setEnderecos(lista);
      setEnderecoId(criado.id_endereco);
      setNovo(VAZIO);
      setFormEndereco(false);
      setMenuEndereco(false);
    } catch (err) {
      setErroEndereco(err.message);
    } finally {
      setSalvandoEndereco(false);
    }
  }

  async function continuar() {
    if (!enderecoId) {
      return Alert.alert('Entrega', 'Escolha ou cadastre um endereço de entrega.');
    }
    setBusy(true);
    try {
      let idCupom = null;
      if (cupomAplicado && carrinho.cupom) idCupom = carrinho.cupom.id_cupom;
      const pedido = await finalizarPedido(enderecoId, idCupom);
      refreshCart();
      go('payment', { order: pedido });
    } catch (e) {
      Alert.alert('Finalizar compra', e.message);
    } finally {
      setBusy(false);
    }
  }

  function campo(chave, rotulo, extra = {}) {
    return (
      <Field
        label={rotulo}
        value={novo[chave]}
        onChangeText={(t) => setNovo({ ...novo, [chave]: t })}
        {...extra}
      />
    );
  }

  if (error) {
    return (
      <ScreenShell active="cart" go={go} cartCount={cartCount}>
        <TopBar title="Finalizar compra" onBack={back} cartCount={cartCount} openCart={openCart} />
        <ErrorState message={error} onRetry={carregar} />
      </ScreenShell>
    );
  }
  if (!carrinho) {
    return (
      <ScreenShell active="cart" go={go} cartCount={cartCount}>
        <TopBar title="Finalizar compra" onBack={back} cartCount={cartCount} openCart={openCart} />
        <Loading />
      </ScreenShell>
    );
  }
  if (carrinho.itens.length === 0) {
    return (
      <ScreenShell active="cart" go={go} cartCount={cartCount}>
        <TopBar title="Finalizar compra" onBack={back} cartCount={cartCount} openCart={openCart} />
        <EmptyState
          icon="shopping-cart"
          title="Seu carrinho está vazio"
          action={<PrimaryButton label="Ver peças" onPress={() => go('catalog')} />}
        />
      </ScreenShell>
    );
  }

  const endereco = enderecos.find((e) => e.id_endereco === enderecoId);

  return (
    <ScreenShell active="cart" go={go} cartCount={cartCount}>
      <TopBar title="Finalizar compra" onBack={back} cartCount={cartCount} openCart={openCart} />
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable style={[styles.selectRow]} onPress={() => setMenuEndereco(true)}>
          <Feather name="map-pin" size={20} color={COLORS.yellow} />
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>ENTREGA</Text>
            <Text style={styles.body}>{endereco ? enderecoTexto(endereco) : 'Adicionar endereço de entrega'}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.muted} />
        </Pressable>

        <View style={styles.selectRow}>
          <Feather name="truck" size={20} color={COLORS.yellow} />
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>FRETE</Text>
            <Text style={styles.body}>
              {carrinho.frete_centavos === 0 ? 'Grátis' : brl(carrinho.frete_centavos)} · Padrão ·{' '}
              {prazoTexto(carrinho.prazo_min_dias, carrinho.prazo_max_dias)}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 8 }]}>Cupom de desconto</Text>
        {cupomAplicado ? (
          <View style={[styles.selectRow, styles.selectRowActive, { marginTop: 10 }]}>
            <Feather name="tag" size={20} color={COLORS.yellow} />
            <Text style={[styles.body, styles.flex, { fontWeight: '800' }]}>{cupomAplicado} aplicado</Text>
            <Pressable onPress={removerCupom} hitSlop={8}>
              <Text style={{ color: COLORS.red, fontWeight: '800' }}>Remover</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.row, { gap: 10, marginTop: 4, alignItems: 'flex-end' }]}>
            <View style={styles.flex}>
              <Field
                placeholder="Digite o código"
                value={cupomTexto}
                onChangeText={setCupomTexto}
                autoCapitalize="characters"
                onSubmitEditing={aplicarCupom}
              />
            </View>
            <View style={{ width: 100 }}>
              <PrimaryButton label="Aplicar" variant="secondary" onPress={aplicarCupom} />
            </View>
          </View>
        )}
        <FormMessage>{cupomErro}</FormMessage>

        <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 18, marginBottom: 10 }]}>Itens</Text>
        {carrinho.itens.map(function (item) {
          return (
            <View key={item.id_produto} style={[styles.cartItem, { alignItems: 'center' }]}>
              <View style={[styles.cartThumb, { width: 52, height: 52 }]}>
                <ProductImage produto={item} size={26} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.mutedText}>{item.marca}</Text>
                <Text style={[styles.body, { fontWeight: '800' }]} numberOfLines={1}>
                  {item.nome}
                </Text>
                <Text style={styles.mutedText}>Quantidade: {item.quantidade}</Text>
              </View>
              <Text style={{ fontWeight: '900', color: COLORS.dark }}>{brl(item.total_centavos)}</Text>
            </View>
          );
        })}

        <View style={{ marginTop: 8 }}>
          <OrderSummary carrinho={carrinho} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          label={busy ? 'Criando pedido...' : 'Continuar para pagamento · ' + brl(carrinho.total_centavos)}
          disabled={busy}
          onPress={continuar}
        />
      </View>

      <Sheet visible={menuEndereco} title="Endereço de entrega" onClose={() => { setMenuEndereco(false); setFormEndereco(false); }}>
        {!formEndereco ? (
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
                    setMenuEndereco(false);
                  }}
                />
              );
            })}
            <PrimaryButton label="Novo endereço" icon="plus" variant="secondary" onPress={() => setFormEndereco(true)} />
          </>
        ) : (
          <>
            {campo('cep', 'CEP', { keyboardType: 'number-pad', placeholder: '00000-000', onChangeText: (t) => setNovo({ ...novo, cep: mascaraCep(t) }) })}
            {campo('logradouro', 'Rua / Avenida', { placeholder: 'Rua das Oficinas' })}
            <View style={[styles.row, { gap: 10 }]}>
              <View style={{ width: 110 }}>{campo('numero', 'Número', { keyboardType: 'number-pad' })}</View>
              <View style={styles.flex}>{campo('complemento', 'Complemento', { placeholder: 'Opcional' })}</View>
            </View>
            {campo('bairro', 'Bairro')}
            <View style={[styles.row, { gap: 10 }]}>
              <View style={styles.flex}>{campo('cidade', 'Cidade')}</View>
              <View style={{ width: 80 }}>
                {campo('uf', 'UF', { autoCapitalize: 'characters', maxLength: 2, onChangeText: (t) => setNovo({ ...novo, uf: t.toUpperCase() }) })}
              </View>
            </View>
            <FormMessage>{erroEndereco}</FormMessage>
            <View style={{ marginTop: 16, gap: 10 }}>
              <PrimaryButton label={salvandoEndereco ? 'Salvando...' : 'Salvar endereço'} disabled={salvandoEndereco} onPress={salvarEndereco} />
              <PrimaryButton label="Voltar" variant="secondary" onPress={() => setFormEndereco(false)} />
            </View>
          </>
        )}
      </Sheet>
    </ScreenShell>
  );
}
