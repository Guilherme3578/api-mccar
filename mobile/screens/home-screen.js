import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { ScreenShell, Header, ProductCard, VehicleSheet, Loading, ErrorState } from '../components/ui';
import { listarCategorias, listarProdutos, listarModelos } from '../services/catalog';
import { criarVeiculo } from '../services/account';

export default function Home({
  user,
  go,
  cartCount,
  favorites,
  toggleFavorite,
  openCart,
  vehicle,
  vehicles,
  refreshVehicles,
}) {
  const [categorias, setCategorias] = useState([]);
  const [destaques, setDestaques] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);

  const primeiroNome = user.nome.split(' ')[0];

  const carregar = useCallback(async function () {
    setError('');
    try {
      const resultados = await Promise.all([
        listarCategorias(),
        listarProdutos({ destaque: 1 }),
        listarModelos(),
      ]);
      setCategorias(resultados[0]);
      setDestaques(resultados[1].slice(0, 6));
      setModelos(resultados[2]);
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

  async function escolherVeiculo(modelo) {
    setBusy(true);
    try {
      await criarVeiculo(modelo.id_modelo_veiculo, vehicles.length === 0);
      await refreshVehicles();
      setSheet(false);
    } catch (e) {
      Alert.alert('Veículo', e.message);
    } finally {
      setBusy(false);
    }
  }

  function abrirCategoria(categoria) {
    go('catalog', { category: categoria.id_categoria });
  }

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
        <Text style={styles.greeting}>Olá, {primeiroNome} 👋</Text>

        <Pressable onPress={() => go('catalog')} style={styles.searchBox}>
          <Feather name="search" size={20} color="#96969B" />
          <Text style={styles.searchPlaceholder}>Buscar peças, marcas ou códigos</Text>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categorias.map(function (categoria) {
            return (
              <Pressable key={categoria.id_categoria} onPress={() => abrirCategoria(categoria)} style={styles.categoryPill}>
                <MaterialCommunityIcons name={categoria.icone || 'car-cog'} size={19} color={COLORS.yellow} />
                <Text style={styles.categoryText}>{categoria.nome}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable onPress={() => setSheet(true)} style={styles.vehicleCard}>
          <View style={styles.vehicleIcon}>
            <Feather name="truck" size={21} color={COLORS.yellow} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.vehicleTitle}>
              {vehicle ? vehicle.marca + ' ' + vehicle.modelo + ' ' + vehicle.ano : 'Adicionar meu veículo'}
            </Text>
            <Text style={styles.vehicleSubtitle}>
              {vehicle ? 'Toque para adicionar outro veículo' : 'Marca, modelo e ano'}
            </Text>
          </View>
          <Feather name="chevron-right" size={21} color={COLORS.muted} />
        </Pressable>

        <View style={styles.banner}>
          <View>
            <View style={styles.bannerTag}>
              <Text style={styles.bannerTagText}>Garantia MCCAR</Text>
            </View>
            <Text style={styles.bannerTitle}>Peças originais com 12{'\n'}meses de garantia</Text>
            <Text style={styles.bannerSubtitle}>Compatibilidade verificada pelo{'\n'}veículo</Text>
          </View>
          <MaterialCommunityIcons name="disc" size={115} color="#4A4A4E" style={styles.bannerDisc} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Destaques</Text>
          <Pressable onPress={() => go('catalog')}>
            <Feather name="chevron-right" size={22} color={COLORS.dark} />
          </Pressable>
        </View>

        <View style={styles.productGrid}>
          {destaques.map(function (produto) {
            return (
              <ProductCard
                key={produto.id_produto}
                product={produto}
                favorite={favorites.includes(produto.id_produto)}
                onFavorite={() => toggleFavorite(produto.id_produto)}
                onPress={() => go('detail', { productId: produto.id_produto })}
              />
            );
          })}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScreenShell active="home" go={go} cartCount={cartCount}>
      <Header cartCount={cartCount} openCart={openCart} />
      {conteudo}
      <VehicleSheet
        visible={sheet}
        modelos={modelos}
        jaCadastrados={vehicles.map((v) => v.id_modelo_veiculo)}
        onPick={escolherVeiculo}
        onClose={() => setSheet(false)}
        busy={busy}
      />
    </ScreenShell>
  );
}
