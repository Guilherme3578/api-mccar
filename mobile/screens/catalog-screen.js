import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, styles } from '../styles/theme';
import {
  ScreenShell,
  TopBar,
  IconButton,
  ProductCard,
  Chip,
  SearchField,
  Toggle,
  Sheet,
  SelectRow,
  Loading,
  ErrorState,
  EmptyState,
  PrimaryButton,
  comIcone,
  nomeVeiculo,
} from '../components/ui';
import { listarCategorias, listarProdutos, ORDENACOES } from '../services/catalog';
import { listarFavoritos } from '../services/account';

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export default function Catalog({
  user,
  go,
  back,
  cartCount,
  favorites,
  vehicle,
  initialCategory,
  initialSearch,
  onlyFavorites,
  autoFocus,
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
        let lista;
        if (onlyFavorites) {
          lista = await listarFavoritos(user.id_usuario);
        } else {
          const filtros = { ordenar: ordenar };
          if (categoria) filtros.id_categoria = categoria;
          if (buscaAplicada) filtros.busca = buscaAplicada;
          if (compativel && vehicle) filtros.id_modelo_veiculo = vehicle.id_modelo_veiculo;
          lista = await listarProdutos(filtros);
        }
        if (numero === requisicao.current) setProdutos(lista);
      } catch (e) {
        if (numero === requisicao.current) setError(e.message);
      } finally {
        if (numero === requisicao.current) setLoading(false);
      }
    },
    [onlyFavorites, user, categoria, buscaAplicada, ordenar, compativel, vehicle]
  );

  useEffect(
    function () {
      carregar();
    },
    [carregar]
  );

  const visiveis = useMemo(
    function () {
      let lista = produtos;
      if (onlyFavorites) {
        lista = lista.filter((p) => favorites.includes(p.id_produto));
        if (categoria) lista = lista.filter((p) => p.id_categoria === categoria);
        if (buscaAplicada) {
          const termo = normalizar(buscaAplicada);
          lista = lista.filter((p) => normalizar(p.nome + ' ' + p.marca + ' ' + p.codigo).includes(termo));
        }
      }
      return comIcone(lista, categorias);
    },
    [produtos, onlyFavorites, favorites, categoria, buscaAplicada, categorias]
  );

  const categoriaAtual = categorias.find((c) => c.id_categoria === categoria);
  const ordemAtual = ORDENACOES.find((o) => o.valor === ordenar);
  const resultadoTexto = visiveis.length === 1 ? '1 resultado' : visiveis.length + ' resultados';
  const placeholder = categoriaAtual ? 'Buscar em ' + categoriaAtual.nome : 'Buscar peças, marcas ou códigos';

  let lista;
  if (loading) {
    lista = <Loading />;
  } else if (error) {
    lista = <ErrorState message={error} onRetry={carregar} />;
  } else if (visiveis.length === 0) {
    lista = onlyFavorites ? (
      <EmptyState
        icon="heart"
        title="Nenhum favorito ainda"
        subtitle="Toque no coração na página de uma peça para salvá-la aqui."
        action={<PrimaryButton label="Ver peças" onPress={() => go('catalog', {}, { replace: true })} />}
      />
    ) : (
      <EmptyState
        icon="search"
        title="Nenhuma peça encontrada"
        subtitle={compativel ? 'Tente desativar o filtro de compatibilidade ou mudar a busca.' : 'Tente outro nome, marca ou código.'}
      />
    );
  } else {
    lista = (
      <FlatList
        data={visiveis}
        keyExtractor={(p) => String(p.id_produto)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, rowGap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={function ({ item }) {
          return <ProductCard product={item} onPress={() => go('detail', { productId: item.id_produto })} />;
        }}
      />
    );
  }

  return (
    <ScreenShell active="catalog" go={go} cartCount={cartCount}>
      <TopBar
        title={onlyFavorites ? 'Favoritos' : 'Peças'}
        onBack={back}
        right={onlyFavorites ? null : <IconButton icon="tune-variant" family="mci" label="Ordenar" onPress={() => setMenuOrdem(true)} />}
      />
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <SearchField value={busca} onChangeText={setBusca} placeholder={placeholder} autoFocus={autoFocus} />
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.chipScroll, { paddingHorizontal: 16, paddingVertical: 12 }]}
        >
          {categorias.map(function (c) {
            const ativo = categoria === c.id_categoria;
            return (
              <Chip
                key={c.id_categoria}
                label={c.nome}
                icon={c.icone || 'car-cog'}
                active={ativo}
                onPress={() => setCategoria(ativo ? null : c.id_categoria)}
              />
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.rowBetween, { paddingHorizontal: 16, marginBottom: 12 }]}>
        <Text style={styles.mutedText}>{loading ? ' ' : resultadoTexto}</Text>
        {onlyFavorites ? null : (
          <Pressable
            onPress={() => setMenuOrdem(true)}
            style={[styles.row, { gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: COLORS.line }]}
          >
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: COLORS.dark }}>{ordemAtual.label}</Text>
            <Feather name="chevron-down" size={16} color={COLORS.dark} />
          </Pressable>
        )}
      </View>

      {onlyFavorites ? null : (
        <View style={[styles.rowBetween, { paddingHorizontal: 16, marginBottom: 12, gap: 12 }]}>
          <View style={styles.flex}>
            <Text style={styles.bodyMedium}>Compatível com meu veículo</Text>
            {!vehicle ? <Text style={styles.smallMuted}>Cadastre um veículo na tela inicial</Text> : null}
            {vehicle && compativel ? <Text style={styles.smallMuted}>{nomeVeiculo(vehicle)}</Text> : null}
          </View>
          <Toggle value={compativel} disabled={!vehicle} onChange={setCompativel} />
        </View>
      )}

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
