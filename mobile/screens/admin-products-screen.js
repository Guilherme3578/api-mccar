import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import {
  ScreenShell,
  TopBar,
  IconButton,
  SearchField,
  ProductThumb,
  Loading,
  ErrorState,
  EmptyState,
  PrimaryButton,
  comIcone,
} from '../components/ui';
import { listarCategorias, listarTodosProdutos, removerProduto } from '../services/catalog';
import { brl } from '../utils/format';

export default function AdminProducts({ go, back }) {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const carregar = useCallback(async function () {
    setError('');
    try {
      const r = await Promise.all([listarTodosProdutos({ ordenar: 'NOME' }), listarCategorias()]);
      setCategorias(r[1]);
      setProdutos(comIcone(r[0], r[1]));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(
    function () {
      carregar();
    },
    [carregar]
  );

  const visiveis = useMemo(
    function () {
      const termo = busca.trim().toLowerCase();
      if (!termo) return produtos;
      return produtos.filter((p) => (p.nome + ' ' + p.marca + ' ' + p.codigo).toLowerCase().includes(termo));
    },
    [produtos, busca]
  );

  function excluir(produto) {
    Alert.alert('Excluir produto', 'Excluir "' + produto.nome + '"? Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async function () {
          try {
            await removerProduto(produto.id_produto);
            setProdutos((lista) => lista.filter((p) => p.id_produto !== produto.id_produto));
          } catch (e) {
            Alert.alert(
              'Excluir produto',
              e.status === 409 || /constraint|vinculad|FOREIGN/i.test(e.message)
                ? 'Este produto já tem pedidos ou carrinhos vinculados. Desative-o na edição em vez de excluir.'
                : e.message
            );
          }
        },
      },
    ]);
  }

  const nomeCategoria = {};
  categorias.forEach((c) => (nomeCategoria[c.id_categoria] = c.nome));

  let conteudo;
  if (loading) {
    conteudo = <Loading />;
  } else if (error) {
    conteudo = <ErrorState message={error} onRetry={carregar} />;
  } else if (visiveis.length === 0) {
    conteudo = (
      <EmptyState
        icon="package"
        title={busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
        action={busca ? null : <PrimaryButton label="Cadastrar produto" icon="plus" onPress={() => go('admin-product-form')} />}
      />
    );
  } else {
    conteudo = (
      <FlatList
        data={visiveis}
        keyExtractor={(p) => String(p.id_produto)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
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
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={function ({ item }) {
          return (
            <Pressable
              onPress={() => go('admin-product-form', { productId: item.id_produto })}
              style={({ pressed }) => [styles.row, { gap: 12, paddingVertical: 12 }, pressed && { opacity: 0.7 }]}
              accessibilityLabel={'Editar ' + item.nome}
            >
              <ProductThumb produto={item} size={56} iconSize={22} />
              <View style={styles.flex}>
                <Text style={styles.smallMuted}>
                  {item.codigo} · {nomeCategoria[item.id_categoria] || '—'}
                </Text>
                <Text style={[styles.bodyMedium, { marginTop: 2 }]} numberOfLines={1}>
                  {item.nome}
                </Text>
                <View style={[styles.row, { gap: 8, marginTop: 2 }]}>
                  <Text style={styles.bodyStrong}>{brl(item.preco_centavos)}</Text>
                  {item.ativo === 0 ? <Text style={[styles.smallMuted, { color: COLORS.red }]}>Inativo</Text> : null}
                  {item.destaque === 1 ? <Text style={[styles.smallMuted, { color: COLORS.yellowText }]}>Destaque</Text> : null}
                </View>
              </View>
              <Pressable onPress={() => excluir(item)} hitSlop={10} accessibilityLabel={'Excluir ' + item.nome}>
                <Feather name="trash-2" size={18} color={COLORS.muted} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    );
  }

  return (
    <ScreenShell tabs={false}>
      <TopBar
        title="Gerenciar produtos"
        onBack={back}
        right={<IconButton icon="plus" label="Novo produto" onPress={() => go('admin-product-form')} />}
      />
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <SearchField value={busca} onChangeText={setBusca} placeholder="Buscar por nome, marca ou código" />
        {!loading && !error ? (
          <Text style={[styles.mutedText, { marginTop: 10 }]}>
            {visiveis.length === 1 ? '1 produto' : visiveis.length + ' produtos'}
          </Text>
        ) : null}
      </View>
      <View style={styles.flex}>{conteudo}</View>
    </ScreenShell>
  );
}
