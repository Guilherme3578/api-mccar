import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { ScreenShell, Header, Sheet, SelectRow, VehicleSheet, PrimaryButton, StatusPill, Loading, ErrorState } from '../components/ui';
import AddressForm from '../components/address-form';
import { listarModelos } from '../services/catalog';
import {
  listarEnderecos,
  removerEndereco,
  listarCartoes,
  removerCartao,
  criarVeiculo,
  removerVeiculo,
  tornarVeiculoPrincipal,
} from '../services/account';
import { listarPedidos, detalharPedido, cancelarPedido } from '../services/shop';
import { brl, dataBr, enderecoTexto, prazoTexto, mascaraCep } from '../utils/format';

function Secao({ titulo, acao, onAcao, children }) {
  return (
    <View style={{ marginTop: 22 }}>
      <View style={[styles.rowBetween, { marginBottom: 10 }]}>
        <Text style={[styles.sectionTitle, { fontSize: 17 }]}>{titulo}</Text>
        {acao ? (
          <Pressable onPress={onAcao} hitSlop={8} style={styles.row}>
            <Feather name="plus" size={16} color={COLORS.yellow} />
            <Text style={{ color: COLORS.yellow, fontWeight: '800', marginLeft: 4 }}>{acao}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Linha({ icon, titulo, subtitulo, badge, onRemover, onPress, extra }) {
  return (
    <Pressable onPress={onPress} style={[styles.selectRow, { marginBottom: 8 }]}>
      <Feather name={icon} size={20} color={COLORS.yellow} />
      <View style={styles.flex}>
        <View style={[styles.row, { gap: 8 }]}>
          <Text style={[styles.body, { flexShrink: 1 }]}>{titulo}</Text>
          {badge ? (
            <View style={[styles.statusPill, { backgroundColor: COLORS.yellowSoft }]}>
              <Text style={[styles.statusText, { color: '#8A6400' }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitulo ? <Text style={styles.mutedText}>{subtitulo}</Text> : null}
        {extra}
      </View>
      {onRemover ? (
        <Pressable onPress={onRemover} hitSlop={10}>
          <Feather name="trash-2" size={18} color={COLORS.red} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export default function Profile({ user, go, cartCount, openCart, onLogout, vehicles, refreshVehicles, refreshCart }) {
  const [enderecos, setEnderecos] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sheetVeiculo, setSheetVeiculo] = useState(false);
  const [sheetEndereco, setSheetEndereco] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(
    async function () {
      setError('');
      try {
        const r = await Promise.all([listarEnderecos(), listarCartoes(), listarPedidos(), refreshVehicles()]);
        setEnderecos(r[0]);
        setCartoes(r[1]);
        setPedidos(r[2].filter((p) => p.status !== 'RASCUNHO'));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [refreshVehicles]
  );

  useEffect(
    function () {
      carregar();
    },
    [carregar]
  );

  async function abrirVeiculos() {
    setSheetVeiculo(true);
    if (modelos.length === 0) {
      try {
        setModelos(await listarModelos());
      } catch (e) {
        Alert.alert('Veículos', e.message);
      }
    }
  }

  async function adicionarVeiculo(modelo) {
    setBusy(true);
    try {
      await criarVeiculo(modelo.id_modelo_veiculo, vehicles.length === 0);
      await refreshVehicles();
      setSheetVeiculo(false);
    } catch (e) {
      Alert.alert('Veículos', e.message);
    } finally {
      setBusy(false);
    }
  }

  function confirmar(titulo, texto, acao) {
    Alert.alert(titulo, texto, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async function () {
          try {
            await acao();
            await carregar();
          } catch (e) {
            Alert.alert(titulo, e.message);
          }
        },
      },
    ]);
  }

  async function abrirPedido(pedido) {
    setDetalhe({ ...pedido, itens: [], pagamento: null, carregando: true });
    try {
      setDetalhe(await detalharPedido(pedido.id_pedido));
    } catch (e) {
      setDetalhe(null);
      Alert.alert('Pedido', e.message);
    }
  }

  function pagarAgora() {
    const pedido = detalhe;
    setDetalhe(null);
    go('payment', { order: pedido });
  }

  function cancelar() {
    Alert.alert('Cancelar pedido', 'Deseja cancelar o pedido ' + detalhe.numero + '?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: async function () {
          try {
            await cancelarPedido(detalhe.id_pedido);
            setDetalhe(null);
            refreshCart();
            await carregar();
          } catch (e) {
            Alert.alert('Pedido', e.message);
          }
        },
      },
    ]);
  }

  const inicial = user.nome.trim().charAt(0).toUpperCase();

  let conteudo;
  if (loading) {
    conteudo = <Loading />;
  } else if (error) {
    conteudo = <ErrorState message={error} onRetry={carregar} />;
  } else {
    conteudo = (
      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={function () {
              setRefreshing(true);
              carregar();
            }}
          />
        }
      >
        <View style={[styles.row, { gap: 14, marginTop: 20 }]}>
          <View style={[styles.logoBox, { width: 58, height: 58, borderRadius: 29 }]}>
            <Text style={[styles.logoLetter, { fontSize: 24 }]}>{inicial}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.dark }}>{user.nome}</Text>
            <Text style={styles.mutedText}>{user.email}</Text>
          </View>
        </View>

        <Secao titulo="Meus veículos" acao="Adicionar" onAcao={abrirVeiculos}>
          {vehicles.length === 0 ? <Text style={styles.mutedText}>Nenhum veículo cadastrado.</Text> : null}
          {vehicles.map(function (v) {
            return (
              <Linha
                key={v.id_veiculo}
                icon="truck"
                titulo={v.marca + ' ' + v.modelo}
                subtitulo={String(v.ano)}
                badge={v.principal === 1 ? 'Principal' : null}
                onPress={
                  v.principal === 1
                    ? undefined
                    : async function () {
                        try {
                          await tornarVeiculoPrincipal(v.id_veiculo);
                          await refreshVehicles();
                        } catch (e) {
                          Alert.alert('Veículos', e.message);
                        }
                      }
                }
                onRemover={() => confirmar('Remover veículo', 'Remover ' + v.marca + ' ' + v.modelo + '?', () => removerVeiculo(v.id_veiculo))}
              />
            );
          })}
          {vehicles.length > 1 ? <Text style={styles.mutedText}>Toque em um veículo para torná-lo o principal.</Text> : null}
        </Secao>

        <Secao titulo="Endereços" acao="Novo" onAcao={() => setSheetEndereco(true)}>
          {enderecos.length === 0 ? <Text style={styles.mutedText}>Nenhum endereço cadastrado.</Text> : null}
          {enderecos.map(function (e) {
            return (
              <Linha
                key={e.id_endereco}
                icon="map-pin"
                titulo={enderecoTexto(e)}
                subtitulo={e.bairro + ' · CEP ' + mascaraCep(e.cep)}
                badge={e.principal === 1 ? 'Principal' : null}
                onRemover={() => confirmar('Remover endereço', 'Remover este endereço?', () => removerEndereco(e.id_endereco))}
              />
            );
          })}
        </Secao>

        <Secao titulo="Pagamento salvo">
          {cartoes.length === 0 ? (
            <Text style={styles.mutedText}>Nenhum cartão salvo. Você pode salvar um cartão ao pagar um pedido.</Text>
          ) : null}
          {cartoes.map(function (c) {
            return (
              <Linha
                key={c.id_cartao}
                icon="credit-card"
                titulo={c.bandeira + ' •••• ' + c.ultimos_quatro}
                subtitulo={c.nome_titular}
                badge={c.principal === 1 ? 'Principal' : null}
                onRemover={() => confirmar('Remover cartão', 'Remover este cartão salvo?', () => removerCartao(c.id_cartao))}
              />
            );
          })}
        </Secao>

        <Secao titulo="Histórico de pedidos">
          {pedidos.length === 0 ? <Text style={styles.mutedText}>Você ainda não fez nenhum pedido.</Text> : null}
          {pedidos.map(function (p) {
            return (
              <Pressable key={p.id_pedido} onPress={() => abrirPedido(p)} style={[styles.selectRow, { marginBottom: 8 }]}>
                <View style={styles.flex}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.body, { fontWeight: '800' }]}>{p.numero}</Text>
                    <Text style={{ fontWeight: '900', color: COLORS.dark }}>{brl(p.total_centavos)}</Text>
                  </View>
                  <View style={[styles.rowBetween, { marginTop: 6 }]}>
                    <StatusPill status={p.status} />
                    <Text style={styles.mutedText}>{dataBr(p.criado_em)}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.muted} />
              </Pressable>
            );
          })}
        </Secao>

        <View style={{ marginTop: 26 }}>
          <PrimaryButton
            label="Sair da conta"
            icon="log-out"
            variant="secondary"
            onPress={() =>
              Alert.alert('Sair', 'Deseja sair da sua conta?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: onLogout },
              ])
            }
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScreenShell active="profile" go={go} cartCount={cartCount}>
      <Header cartCount={cartCount} openCart={openCart} />
      {conteudo}

      <VehicleSheet
        visible={sheetVeiculo}
        modelos={modelos}
        jaCadastrados={vehicles.map((v) => v.id_modelo_veiculo)}
        onPick={adicionarVeiculo}
        onClose={() => setSheetVeiculo(false)}
        busy={busy}
      />

      <Sheet visible={sheetEndereco} title="Novo endereço" onClose={() => setSheetEndereco(false)}>
        <AddressForm
          principal={enderecos.length === 0}
          onSaved={function () {
            setSheetEndereco(false);
            carregar();
          }}
          onCancel={() => setSheetEndereco(false)}
        />
      </Sheet>

      <Sheet visible={detalhe !== null} title={detalhe ? 'Pedido ' + detalhe.numero : ''} onClose={() => setDetalhe(null)}>
        {detalhe ? (
          detalhe.carregando ? (
            <Loading />
          ) : (
            <View>
              <View style={[styles.rowBetween, { marginBottom: 12 }]}>
                <StatusPill status={detalhe.status} />
                <Text style={styles.mutedText}>{dataBr(detalhe.criado_em)}</Text>
              </View>
              {detalhe.itens.map(function (i) {
                return (
                  <View key={i.id_produto} style={[styles.rowBetween, { paddingVertical: 6 }]}>
                    <Text style={[styles.body, { flex: 1 }]}>
                      {i.quantidade}x {i.nome_produto}
                    </Text>
                    <Text style={styles.body}>{brl(i.total_centavos)}</Text>
                  </View>
                );
              })}
              <View style={styles.divider} />
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{brl(detalhe.subtotal_centavos)}</Text>
              </View>
              {detalhe.desconto_centavos > 0 ? (
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Desconto</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.green }]}>- {brl(detalhe.desconto_centavos)}</Text>
                </View>
              ) : null}
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Frete</Text>
                <Text style={styles.summaryValue}>{detalhe.frete_centavos === 0 ? 'Grátis' : brl(detalhe.frete_centavos)}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{brl(detalhe.total_centavos)}</Text>
              </View>
              <View style={styles.divider} />
              <Text style={styles.eyebrow}>ENTREGA</Text>
              <Text style={[styles.body, { marginTop: 4 }]}>{enderecoTexto(detalhe)}</Text>
              <Text style={[styles.mutedText, { marginTop: 2 }]}>Prazo: {prazoTexto(detalhe.prazo_min_dias, detalhe.prazo_max_dias)}</Text>
              <Text style={[styles.eyebrow, { marginTop: 12 }]}>PAGAMENTO</Text>
              <Text style={[styles.body, { marginTop: 4 }]}>
                {detalhe.pagamento
                  ? detalhe.pagamento.metodo +
                    (detalhe.pagamento.cartao_final ? ' •••• ' + detalhe.pagamento.cartao_final : '') +
                    ' · ' +
                    detalhe.pagamento.status
                  : 'Ainda não pago'}
              </Text>

              <View style={{ marginTop: 18, gap: 10 }}>
                {detalhe.status === 'AGUARDANDO_PAGAMENTO' && (!detalhe.pagamento || detalhe.pagamento.status === 'RECUSADO') ? (
                  <PrimaryButton label="Pagar agora" variant="yellow" onPress={pagarAgora} />
                ) : null}
                {detalhe.status === 'AGUARDANDO_PAGAMENTO' ? (
                  <PrimaryButton label="Cancelar pedido" variant="secondary" onPress={cancelar} />
                ) : null}
              </View>
            </View>
          )
        ) : null}
      </Sheet>
    </ScreenShell>
  );
}
