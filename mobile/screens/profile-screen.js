import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, styles } from '../styles/theme';
import {
  ScreenShell,
  InfoRow,
  Sheet,
  SelectRow,
  VehicleSheet,
  PrimaryButton,
  StatusPill,
  SummaryLine,
  TotalLine,
  TextLink,
  Loading,
  ErrorState,
  nomeVeiculo,
} from '../components/ui';
import AddressForm from '../components/address-form';
import { Field, FormMessage } from '../components/auth-form';
import { listarModelos } from '../services/catalog';
import {
  listarEnderecos,
  removerEndereco,
  listarCartoes,
  removerCartao,
  tornarCartaoPrincipal,
  criarVeiculo,
  removerVeiculo,
  tornarVeiculoPrincipal,
  atualizarUsuario,
  removerUsuario,
} from '../services/account';
import { listarPedidos, detalharPedido, cancelarPedido } from '../services/shop';
import { exportarJson } from '../services/export';
import { brl, dataBr, enderecoTexto, iniciais, mascaraCep, nomeBandeira, prazoTexto, textoMetodo } from '../utils/format';

function BotaoRemover({ onPress, alvo }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityLabel={alvo ? 'Remover ' + alvo : 'Remover'}>
      <Feather name="trash-2" size={18} color={COLORS.muted} />
    </Pressable>
  );
}

function LinhaPedido({ pedido, onPress, last }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
        !last && { borderBottomWidth: 1, borderBottomColor: COLORS.line },
        pressed && { backgroundColor: COLORS.field },
      ]}
    >
      <View style={styles.rowBetween}>
        <Text style={styles.bodyStrong}>{pedido.numero}</Text>
        <StatusPill status={pedido.status} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.smallMuted}>{dataBr(pedido.criado_em)}</Text>
        <Text style={styles.bodyStrong}>{brl(pedido.total_centavos)}</Text>
      </View>
    </Pressable>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ContaForm({ user, onSaved, onDeleted, onLogout }) {
  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (nome.trim().length < 2) return setErro('Informe o seu nome.');
    if (!EMAIL.test(email.trim())) return setErro('Informe um e-mail válido.');
    if (senha && senha.length < 6) return setErro('A nova senha deve ter no mínimo 6 caracteres.');
    setErro('');
    setSalvando(true);
    try {
      const dados = { nome: nome.trim(), email: email.trim().toLowerCase() };
      if (senha) dados.senha = senha;
      const atualizado = await atualizarUsuario(user.id_usuario, dados);
      setSenha('');
      onSaved({ ...user, ...dados, ...(atualizado || {}) });
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  function excluirConta() {
    Alert.alert(
      'Excluir conta',
      'Sua conta, endereços, veículos e cartões salvos serão apagados. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir conta',
          style: 'destructive',
          onPress: async function () {
            try {
              await removerUsuario(user.id_usuario);
              onDeleted();
            } catch (e) {
              Alert.alert('Excluir conta', e.message);
            }
          },
        },
      ]
    );
  }

  return (
    <View>
      <Field label="Nome completo" value={nome} onChangeText={setNome} autoCapitalize="words" />
      <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Field label="Nova senha (opcional)" placeholder="Deixe em branco para manter" value={senha} onChangeText={setSenha} secret autoCapitalize="none" />
      <FormMessage>{erro}</FormMessage>
      <View style={{ marginTop: 16, gap: 10 }}>
        <PrimaryButton label={salvando ? 'Salvando...' : 'Salvar alterações'} loading={salvando} onPress={salvar} />
        <PrimaryButton label="Sair da conta" icon="log-out" variant="secondary" onPress={onLogout} disabled={salvando} />
      </View>
      <View style={{ marginTop: 18, marginBottom: 4 }}>
        <TextLink label="Excluir minha conta" icon="user-x" color={COLORS.red} onPress={excluirConta} />
      </View>
    </View>
  );
}

export default function Profile({
  user,
  go,
  cartCount,
  onLogout,
  onUserUpdated,
  vehicles,
  refreshVehicles,
  refreshCart,
  openOrder,
}) {
  const [enderecos, setEnderecos] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(null);
  const [formEndereco, setFormEndereco] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exportando, setExportando] = useState(false);
  const admin = user.perfil === 'ADMIN';

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

  useEffect(
    function () {
      if (openOrder) abrirPedido({ id_pedido: openOrder });
    },
    [openOrder]
  );

  async function abrirModelos() {
    setSheet('modelos');
    if (modelos.length === 0) {
      try {
        setModelos(await listarModelos());
      } catch (e) {
        setSheet('veiculos');
        Alert.alert('Veículos', e.message);
      }
    }
  }

  async function adicionarVeiculo(modelo) {
    setBusy(true);
    try {
      await criarVeiculo(modelo.id_modelo_veiculo, vehicles.length === 0);
      await refreshVehicles();
      setSheet('veiculos');
    } catch (e) {
      Alert.alert('Veículos', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function tornarPrincipal(v) {
    try {
      await tornarVeiculoPrincipal(v.id_veiculo);
      await refreshVehicles();
    } catch (e) {
      Alert.alert('Veículos', e.message);
    }
  }

  function confirmarRemocao(titulo, texto, acao) {
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
    setSheet(null);
    setDetalhe({ ...pedido, carregando: true });
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

  async function exportar() {
    setExportando(true);
    try {
      const r = await exportarJson();
      const resumo = (r.dados && r.dados.resumo) || {};
      Alert.alert(
        'Dados exportados',
        (resumo.pedidos_total ?? 0) +
          ' pedidos no arquivo JSON, com faturamento de ' +
          brl(resumo.faturamento_centavos || 0) +
          '.' +
          (r.compartilhou ? '' : ' Arquivo salvo em ' + r.uri)
      );
    } catch (e) {
      Alert.alert('Exportar dados', e.status === 403 ? 'Somente administradores podem exportar os dados da loja.' : e.message);
    } finally {
      setExportando(false);
    }
  }

  async function definirCartaoPrincipal(c) {
    if (c.principal === 1) return;
    try {
      await tornarCartaoPrincipal(c.id_cartao);
      setCartoes(await listarCartoes());
    } catch (e) {
      Alert.alert('Cartões', e.message);
    }
  }

  function sairDaConta() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => onLogout() },
    ]);
  }

  const veiculoPrincipal = vehicles.find((v) => v.principal === 1) || vehicles[0];
  const enderecoPrincipal = enderecos.find((e) => e.principal === 1) || enderecos[0];
  const cartaoPrincipal = cartoes.find((c) => c.principal === 1) || cartoes[0];

  let conteudo;
  if (loading) {
    conteudo = <Loading />;
  } else if (error) {
    conteudo = <ErrorState message={error} onRetry={carregar} />;
  } else {
    conteudo = (
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
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
        <Pressable
          onPress={() => setSheet('conta')}
          style={[styles.cardOutline, styles.row, { gap: 12, padding: 16, marginTop: 12 }]}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: COLORS.yellowSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 17, color: COLORS.yellowText }}>{iniciais(user.nome)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={[styles.bodyStrong, { fontSize: 15, lineHeight: 19 }]} numberOfLines={1}>
              {user.nome}
            </Text>
            <Text style={[styles.smallMuted, { lineHeight: 19 }]} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
          <Feather name="chevron-right" size={22} color={COLORS.muted} />
        </Pressable>

        <View style={[styles.cardOutline, { marginTop: 12 }]}>
          <InfoRow
            icon="car-outline"
            iconFamily="mci"
            label="Veículo"
            valueColumn={156}
            value={veiculoPrincipal ? nomeVeiculo(veiculoPrincipal) : 'Adicionar veículo'}
            placeholder={!veiculoPrincipal}
            onPress={() => setSheet('veiculos')}
          />
          <InfoRow
            icon="map-pin"
            label="Endereços"
            valueColumn={156}
            value={enderecoPrincipal ? enderecoPrincipal.logradouro + ', ' + enderecoPrincipal.numero : 'Adicionar endereço'}
            placeholder={!enderecoPrincipal}
            onPress={() => setSheet('enderecos')}
          />
          <InfoRow
            icon="credit-card"
            label="Pagamento"
            valueColumn={156}
            value={cartaoPrincipal ? nomeBandeira(cartaoPrincipal.bandeira) + ' •••• ' + cartaoPrincipal.ultimos_quatro : 'Nenhum cartão salvo'}
            placeholder={!cartaoPrincipal}
            onPress={() => setSheet('cartoes')}
            last
          />
        </View>

        <View style={[styles.cardOutline, { marginTop: 12 }]}>
          {admin ? (
            <>
              <InfoRow
                icon="package"
                label="Admin"
                valueColumn={156}
                value="Gerenciar produtos"
                subtitle="Cadastrar, editar e excluir"
                onPress={() => go('admin-products')}
              />
              <InfoRow
                icon="download"
                label="Dados"
                valueColumn={156}
                value={exportando ? 'Gerando arquivo...' : 'Gerar JSON'}
                subtitle="Vendas da loja para o dashboard"
                onPress={exportando ? undefined : exportar}
                chevron
              />
            </>
          ) : null}
          <InfoRow icon="headphones" label="Ajuda" valueColumn={156} value="Fale conosco" onPress={() => go('contact')} last />
        </View>

        <View style={[styles.rowBetween, { marginTop: 20, marginBottom: 12 }]}>
          <Text style={styles.sectionTitle}>Meus pedidos</Text>
          {pedidos.length > 0 ? (
            <Pressable onPress={() => setSheet('pedidos')} hitSlop={8}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: COLORS.muted }}>Ver todos</Text>
            </Pressable>
          ) : null}
        </View>

        {pedidos.length === 0 ? (
          <View style={[styles.cardOutline, { padding: 16, alignItems: 'center' }]}>
            <Text style={styles.mutedText}>Você ainda não fez nenhum pedido.</Text>
          </View>
        ) : (
          <View style={styles.cardOutline}>
            {pedidos.slice(0, 3).map(function (p, i, lista) {
              return <LinhaPedido key={p.id_pedido} pedido={p} onPress={() => abrirPedido(p)} last={i === lista.length - 1} />;
            })}
          </View>
        )}

        <View style={{ marginTop: 22 }}>
          <TextLink label="Sair da conta" icon="log-out" onPress={sairDaConta} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScreenShell active="profile" go={go} cartCount={cartCount}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <Text style={styles.pageTitle}>Perfil</Text>
      </View>
      {conteudo}

      <Sheet visible={sheet === 'conta'} title="Minha conta" onClose={() => setSheet(null)}>
        <ContaForm
          user={user}
          onLogout={sairDaConta}
          onSaved={function (atualizado) {
            onUserUpdated(atualizado);
            setSheet(null);
            Alert.alert('Minha conta', 'Dados atualizados.');
          }}
          onDeleted={function () {
            setSheet(null);
            onLogout('Sua conta foi excluída.');
          }}
        />
      </Sheet>

      <Sheet visible={sheet === 'veiculos'} title="Meus veículos" onClose={() => setSheet(null)}>
        {vehicles.length === 0 ? <Text style={[styles.mutedText, { marginBottom: 12 }]}>Nenhum veículo cadastrado.</Text> : null}
        {vehicles.map(function (v) {
          const principal = v.principal === 1;
          return (
            <SelectRow
              key={v.id_veiculo}
              icon="car-outline"
              iconFamily="mci"
              active={principal}
              title={v.marca + ' ' + v.modelo}
              subtitle={principal ? v.ano + ' · Principal' : v.ano + ' · Toque para tornar principal'}
              onPress={principal ? undefined : () => tornarPrincipal(v)}
              right={
                <BotaoRemover
                  alvo={v.marca + ' ' + v.modelo}
                  onPress={() =>
                    confirmarRemocao('Remover veículo', 'Remover ' + v.marca + ' ' + v.modelo + '?', () => removerVeiculo(v.id_veiculo))
                  }
                />
              }
            />
          );
        })}
        <PrimaryButton label="Adicionar veículo" icon="plus" variant="secondary" onPress={abrirModelos} />
      </Sheet>

      <VehicleSheet
        visible={sheet === 'modelos'}
        modelos={modelos}
        jaCadastrados={vehicles.map((v) => v.id_modelo_veiculo)}
        onPick={adicionarVeiculo}
        onClose={() => setSheet('veiculos')}
        busy={busy}
      />

      <Sheet
        visible={sheet === 'enderecos'}
        title={formEndereco === 'novo' ? 'Novo endereço' : formEndereco ? 'Editar endereço' : 'Endereços'}
        onClose={function () {
          setSheet(null);
          setFormEndereco(null);
        }}
      >
        {formEndereco ? (
          <AddressForm
            key={formEndereco === 'novo' ? 'novo' : formEndereco.id_endereco}
            endereco={formEndereco === 'novo' ? null : formEndereco}
            principal={enderecos.length === 0}
            onCancel={() => setFormEndereco(null)}
            onSaved={function () {
              setFormEndereco(null);
              carregar();
            }}
          />
        ) : (
          <>
            {enderecos.length === 0 ? <Text style={[styles.mutedText, { marginBottom: 12 }]}>Nenhum endereço cadastrado.</Text> : null}
            {enderecos.map(function (e) {
              return (
                <SelectRow
                  key={e.id_endereco}
                  icon="map-pin"
                  active={e.principal === 1}
                  title={enderecoTexto(e)}
                  subtitle={e.bairro + ' · CEP ' + mascaraCep(e.cep) + (e.principal === 1 ? ' · Principal' : ' · Toque para editar')}
                  onPress={() => setFormEndereco(e)}
                  right={
                    <BotaoRemover
                      alvo={enderecoTexto(e)}
                      onPress={() => confirmarRemocao('Remover endereço', 'Remover este endereço?', () => removerEndereco(e.id_endereco))}
                    />
                  }
                />
              );
            })}
            <PrimaryButton label="Novo endereço" icon="plus" variant="secondary" onPress={() => setFormEndereco('novo')} />
          </>
        )}
      </Sheet>

      <Sheet visible={sheet === 'cartoes'} title="Cartões salvos" onClose={() => setSheet(null)}>
        {cartoes.length === 0 ? (
          <Text style={[styles.mutedText, { marginBottom: 12 }]}>
            Nenhum cartão salvo. Você pode salvar um cartão ao pagar um pedido.
          </Text>
        ) : null}
        {cartoes.map(function (c) {
          return (
            <SelectRow
              key={c.id_cartao}
              icon="credit-card"
              active={c.principal === 1}
              title={nomeBandeira(c.bandeira) + ' •••• ' + c.ultimos_quatro}
              subtitle={c.nome_titular + (c.principal === 1 ? ' · Principal' : ' · Toque para tornar principal')}
              onPress={() => definirCartaoPrincipal(c)}
              right={
                <BotaoRemover
                  alvo={nomeBandeira(c.bandeira) + ' ' + c.ultimos_quatro}
                  onPress={() => confirmarRemocao('Remover cartão', 'Remover este cartão salvo?', () => removerCartao(c.id_cartao))}
                />
              }
            />
          );
        })}
      </Sheet>

      <Sheet visible={sheet === 'pedidos'} title="Meus pedidos" onClose={() => setSheet(null)}>
        <View style={[styles.cardOutline, { marginBottom: 8 }]}>
          {pedidos.map(function (p, i) {
            return <LinhaPedido key={p.id_pedido} pedido={p} onPress={() => abrirPedido(p)} last={i === pedidos.length - 1} />;
          })}
        </View>
      </Sheet>

      <Sheet visible={detalhe !== null} title={detalhe && detalhe.numero ? 'Pedido ' + detalhe.numero : 'Pedido'} onClose={() => setDetalhe(null)}>
        {detalhe ? (
          detalhe.carregando ? (
            <Loading />
          ) : (
            <View>
              <View style={[styles.rowBetween, { marginBottom: 12 }]}>
                <StatusPill status={detalhe.status} />
                <Text style={styles.smallMuted}>{dataBr(detalhe.criado_em)}</Text>
              </View>
              {(detalhe.itens || []).map(function (i) {
                return (
                  <View key={i.id_produto} style={[styles.rowBetween, { paddingVertical: 6, gap: 12 }]}>
                    <Text style={[styles.body, styles.flex]}>
                      {i.quantidade}x {i.nome_produto}
                    </Text>
                    <Text style={styles.bodyMedium}>{brl(i.total_centavos)}</Text>
                  </View>
                );
              })}
              <View style={[styles.divider, { marginVertical: 8 }]} />
              <SummaryLine label="Subtotal" value={brl(detalhe.subtotal_centavos)} />
              {detalhe.desconto_centavos > 0 ? <SummaryLine label="Desconto" value={'- ' + brl(detalhe.desconto_centavos)} green /> : null}
              <SummaryLine label="Frete" value={detalhe.frete_centavos === 0 ? 'Grátis' : brl(detalhe.frete_centavos)} />
              <TotalLine value={brl(detalhe.total_centavos)} />

              <View style={[styles.cardOutline, { marginTop: 16 }]}>
                <InfoRow
                  label="Entrega"
                  value={enderecoTexto(detalhe)}
                  subtitle={'Prazo: ' + prazoTexto(detalhe.prazo_min_dias, detalhe.prazo_max_dias)}
                />
                <InfoRow
                  label="Pagamento"
                  last
                  value={textoMetodo(detalhe.pagamento)}
                  subtitle={detalhe.pagamento ? detalhe.pagamento.status.charAt(0) + detalhe.pagamento.status.slice(1).toLowerCase() : null}
                />
              </View>

              <View style={{ marginTop: 16, gap: 10 }}>
                {detalhe.status === 'AGUARDANDO_PAGAMENTO' &&
                (!detalhe.pagamento || detalhe.pagamento.status === 'RECUSADO' || detalhe.pagamento.metodo === 'MERCADO_PAGO') ? (
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
