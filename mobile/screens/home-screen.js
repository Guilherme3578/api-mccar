import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { ScreenShell, Header, ProductCard, Chip, Dots, VehicleSheet, Loading, ErrorState, nomeVeiculo, comIcone } from '../components/ui';
import { listarCategorias, listarProdutos, listarModelos } from '../services/catalog';
import { criarVeiculo } from '../services/account';

const BANNERS = [
  {
    tag: 'Garantia MCCAR',
    titulo: 'Peças originais com 12\nmeses de garantia',
    subtitulo: 'Compatibilidade verificada pelo\nveículo',
    icone: 'disc',
  },
  {
    tag: 'Frete grátis',
    titulo: 'Frete grátis em compras\nacima de R$ 100',
    subtitulo: 'Entrega rápida para todo\no Brasil',
    icone: 'truck-fast-outline',
  },
  {
    tag: 'Primeira compra',
    titulo: '50% de desconto com o\ncupom BEMVINDO50',
    subtitulo: 'Aplique o cupom ao\nfinalizar a compra',
    icone: 'ticket-percent-outline',
  },
];

export default function Home({ go, cartCount, vehicle, vehicles, refreshVehicles }) {
  const { width } = useWindowDimensions();
  const [categorias, setCategorias] = useState([]);
  const [destaques, setDestaques] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(0);

  const larguraBanner = width - 32;
  const passoBanner = larguraBanner + 12;

  const carregar = useCallback(async function () {
    setError('');
    try {
      const resultados = await Promise.all([listarCategorias(), listarProdutos({ destaque: 1 })]);
      setCategorias(resultados[0]);
      setDestaques(comIcone(resultados[1].slice(0, 6), resultados[0]));
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

  async function abrirVeiculos() {
    setSheet(true);
    if (modelos.length === 0) {
      try {
        setModelos(await listarModelos());
      } catch (e) {
        setSheet(false);
        Alert.alert('Veículo', e.message);
      }
    }
  }

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

  let conteudo;
  if (loading) {
    conteudo = <Loading />;
  } else if (error) {
    conteudo = <ErrorState message={error} onRetry={carregar} />;
  } else {
    conteudo = (
      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={COLORS.yellow}
            colors={[COLORS.yellow]}
            onRefresh={function () {
              setRefreshing(true);
              carregar();
              refreshVehicles();
            }}
          />
        }
      >
        <View style={{ paddingHorizontal: 16 }}>
          <Pressable onPress={() => go('catalog', { focus: true })} style={styles.searchBox} accessibilityRole="search">
            <Feather name="search" size={20} color={COLORS.placeholder} />
            <Text style={styles.searchPlaceholder}>Buscar peças, marcas ou códigos</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipScroll, { paddingHorizontal: 16, paddingVertical: 12 }]}
        >
          {categorias.map(function (categoria) {
            return (
              <Chip
                key={categoria.id_categoria}
                label={categoria.nome}
                icon={categoria.icone || 'car-cog'}
                onPress={() => go('catalog', { category: categoria.id_categoria })}
              />
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 16 }}>
          <Pressable onPress={abrirVeiculos} style={styles.vehicleCard}>
            <MaterialCommunityIcons name="car-outline" size={24} color={COLORS.yellow} />
            <View style={styles.flex}>
              <Text style={styles.vehicleTitle}>{vehicle ? nomeVeiculo(vehicle) : 'Adicionar meu veículo'}</Text>
              <Text style={styles.vehicleSubtitle}>{vehicle ? 'Toque para adicionar outro veículo' : 'Marca, modelo e ano'}</Text>
            </View>
            <Feather name="chevron-right" size={24} color={COLORS.muted} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          snapToInterval={passoBanner}
          disableIntervalMomentum
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => setBanner(Math.round(e.nativeEvent.contentOffset.x / passoBanner))}
        >
          {BANNERS.map(function (b) {
            return (
              <Pressable key={b.tag} onPress={() => go('catalog')} style={[styles.banner, { width: larguraBanner }]}>
                <View style={styles.bannerTag}>
                  <Text style={styles.bannerTagText}>{b.tag}</Text>
                </View>
                <Text style={styles.bannerTitle}>{b.titulo}</Text>
                <Text style={styles.bannerSubtitle}>{b.subtitulo}</Text>
                <MaterialCommunityIcons name={b.icone} size={120} color="#3F3F46" style={styles.bannerArt} />
              </Pressable>
            );
          })}
        </ScrollView>
        <Dots count={BANNERS.length} active={banner} />

        <View style={{ paddingHorizontal: 16 }}>
          <Pressable style={styles.sectionHeader} onPress={() => go('catalog')}>
            <Text style={styles.sectionTitle}>Destaques</Text>
            <Feather name="chevron-right" size={20} color={COLORS.dark} />
          </Pressable>

          <View style={styles.productGrid}>
            {destaques.map(function (produto) {
              return (
                <ProductCard
                  key={produto.id_produto}
                  product={produto}
                  onPress={() => go('detail', { productId: produto.id_produto })}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScreenShell active="home" go={go} cartCount={cartCount}>
      <Header onFavorites={() => go('catalog', { favorites: true })} />
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
