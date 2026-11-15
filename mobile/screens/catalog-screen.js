import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { ScreenShell, TopBar, ProductCard, Pill, Sheet, SelectRow, Loading, ErrorState, EmptyState } from '../components/ui';
import { listarCategorias, listarProdutos, ORDENACOES } from '../services/catalog';

export default function Catalog({
  go,
  back,
  cartCount,
  openCart,
  favorites,
  toggleFavorite,
  vehicle,
  initialCategory,
  initialSearch,
}) {
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState(initialCategory);
  const [busca, setBusca] = useState(initialSearch);
  const [buscaAplicada, setBuscaAplicada] = useState(initialSearch);
  const [ordenar, setOrdenar] = useState('RELEVANCIA');
  const [compativel, setCompativel] = useState(false);
  const [menuOrdem, setMenuOrdem] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requisicao = useRef(0);

  useEffect(function () {
    listarCategorias()
      .then(setCategorias)
      .catch(function () {});
  }, []);

  useEffect(
    function () {
      const t = setTimeout(function () {
        setBuscaAplicada(busca.trim());
      }, 350);
      return function () {
        clearTimeout(t);
      };
    },
    [busca]
  );

  const carregar = useCallback(
    async function () {
      const numero = ++requisicao.current;
      setLoading(true);
      setError('');
      try {
        const filtros = { ordenar: ordenar };
        if (categoria) filtros.id_categoria = categoria;
        if (buscaAplicada) filtros.busca = buscaAplicada;
        if (compativel && vehicle) filtros.id_modelo_veiculo = vehicle.id_modelo_veiculo;
        const lista = await listarProdutos(filtros);
        if (numero === requisicao.current) setProdutos(lista);
      } catch (e) {
        if (numero === requisicao.current) setError(e.message);
      } finally {
        if (numero === requisicao.current) setLoading(false);
      }
    },
    [categoria, buscaAplicada, ordenar, compativel, vehicle]
  );

  useEffect(
    function () {
      carregar();
    },
    [carregar]
  );

  const ordemAtual = ORDENACOES.find((o) => o.valor === ordenar);
  const resultadoTexto = produtos.length === 1 ? '1 resultado' : produtos.length + ' resultados';

  let lista;
  if (loading) {
    lista = <Loading />;
  } else if (error) {
    lista = <ErrorState message={error} onRetry={carregar} />;
  } else if (produtos.length === 0) {
    lista = (
      <EmptyState
        icon="search"
        title="Nenhuma peça encontrada"
        subtitle={compativel ? 'Tente desativar o filtro de compatibilidade ou mudar a busca.' : 'Tente outro nome, marca ou código.'}
      />
    );
  } else {
    lista = (
      <FlatList
        data={produtos}
        keyExtractor={(p) => String(p.id_produto)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, rowGap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={function ({ item }) {
          return (
            <ProductCard
              product={item}
              favorite={favorites.includes(item.id_produto)}
              onFavorite={() => toggleFavorite(item.id_produto)}
              onPress={() => go('detail', { productId: item.id_produto })}
            />
          );
        }}
      />
    );
  }

  return (
    <ScreenShell active="catalog" go={go} cartCount={cartCount}>
      <TopBar title="Peças" onBack={back} cartCount={cartCount} openCart={openCart} />
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <View style={styles.searchBox}>
          <Feather name="search" size={20} color="#96969B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar em Peças"
            placeholderTextColor={COLORS.muted}
            value={busca}
            onChangeText={setBusca}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {busca ? (
            <Pressable onPress={() => setBusca('')} hitSlop={8}>
              <Feather name="x" size={18} color={COLORS.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
        >
          <Pill label="Todos" active={!categoria} onPress={() => setCategoria(null)} />
          {categorias.map(function (c) {
            return (
              <Pill
                key={c.id_categoria}
                label={c.nome}
                active={categoria === c.id_categoria}
                onPress={() => setCategoria(c.id_categoria)}
              />
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.rowBetween, { paddingHorizontal: 20, marginBottom: 6 }]}>
        <Text style={styles.mutedText}>{loading ? ' ' : resultadoTexto}</Text>
        <Pressable onPress={() => setMenuOrdem(true)} style={styles.row} hitSlop={8}>
          <Text style={[styles.body, { fontWeight: '700' }]}>{ordemAtual.label}</Text>
          <Feather name="chevron-down" size={16} color={COLORS.dark} />
        </Pressable>
      </View>

      <View style={[styles.rowBetween, { paddingHorizontal: 20, marginBottom: 12 }]}>
        <View style={styles.flex}>
          <Text style={[styles.body, { fontWeight: '800' }]}>Compatível com meu veículo</Text>
          {!vehicle ? <Text style={styles.mutedText}>Cadastre um veículo na tela inicial</Text> : null}
          {vehicle && compativel ? (
            <Text style={styles.mutedText}>{vehicle.marca + ' ' + vehicle.modelo + ' ' + vehicle.ano}</Text>
          ) : null}
        </View>
        <Switch
          value={compativel}
          disabled={!vehicle}
          onValueChange={setCompativel}
          trackColor={{ false: COLORS.line, true: COLORS.yellow }}
          thumbColor={COLORS.white}
        />
      </View>

      <View style={styles.flex}>{lista}</View>

      <Sheet visible={menuOrdem} title="Ordenar por" onClose={() => setMenuOrdem(false)}>
        {ORDENACOES.map(function (o) {
          return (
            <SelectRow
              key={o.valor}
              active={o.valor === ordenar}
              title={o.label}
              onPress={function () {
                setOrdenar(o.valor);
                setMenuOrdem(false);
              }}
            />
          );
        })}
      </Sheet>
    </ScreenShell>
  );
}
