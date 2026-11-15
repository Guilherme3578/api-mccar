import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './screens/login-screen';
import RegisterScreen from './screens/register-screen';
import Home from './screens/home-screen';
import Catalog from './screens/catalog-screen';
import Detail from './screens/detail-screen';
import Cart from './screens/cart-screen';
import Checkout from './screens/checkout-screen';
import Payment from './screens/payment-screen';
import Confirmation from './screens/confirmation-screen';
import Profile from './screens/profile-screen';
import { Loading } from './components/ui';

import { definirAoExpirar } from './services/api';
import { restaurarSessao, sair } from './services/auth';
import { meuCarrinho, adicionarAoCarrinho } from './services/shop';
import { listarVeiculos, listarFavoritos, favoritar, desfavoritar } from './services/account';

const ABAS = ['home', 'catalog', 'cart', 'profile'];

export default function App() {
  const [carregando, setCarregando] = useState(true);
  const [user, setUser] = useState(null);
  const [authPage, setAuthPage] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [pilha, setPilha] = useState([{ name: 'home', params: {} }]);
  const [cartCount, setCartCount] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const sessaoRef = useRef(false);

  const route = pilha[pilha.length - 1];

  const go = useCallback(function (name, params = {}) {
    setPilha(function (atual) {
      if (ABAS.includes(name)) {
        return [{ name: name, params: params }];
      }
      if (name === 'confirmation') {
        return [{ name: 'home', params: {} }, { name: name, params: params }];
      }
      return [...atual, { name: name, params: params }];
    });
  }, []);

  const replace = useCallback(function (name, params = {}) {
    setPilha(function (atual) {
      return [...atual.slice(0, -1), { name: name, params: params }];
    });
  }, []);

  const back = useCallback(function () {
    setPilha(function (atual) {
      if (atual.length > 1) return atual.slice(0, -1);
      return [{ name: 'home', params: {} }];
    });
  }, []);

  const resetarEstado = useCallback(function () {
    setUser(null);
    setCartCount(0);
    setFavorites([]);
    setVehicles([]);
    setPilha([{ name: 'home', params: {} }]);
    setAuthPage('login');
  }, []);

  const refreshCart = useCallback(async function () {
    try {
      const carrinho = await meuCarrinho();
      setCartCount(carrinho.quantidade_itens || 0);
      return carrinho;
    } catch (e) {
      return null;
    }
  }, []);

  const refreshVehicles = useCallback(async function () {
    try {
      const lista = await listarVeiculos();
      setVehicles(lista);
      return lista;
    } catch (e) {
      return [];
    }
  }, []);

  const carregarDadosDoUsuario = useCallback(
    async function (conta) {
      refreshCart();
      refreshVehicles();
      try {
        const favs = await listarFavoritos(conta.id_usuario);
        setFavorites(favs.map((f) => f.id_produto));
      } catch (e) {
        setFavorites([]);
      }
    },
    [refreshCart, refreshVehicles]
  );

  useEffect(function () {
    definirAoExpirar(function () {
      if (sessaoRef.current) {
        sessaoRef.current = false;
        resetarEstado();
        setLoginMessage('');
        Alert.alert('Sessão expirada', 'Entre novamente para continuar.');
      }
    });
    (async function () {
      try {
        const conta = await restaurarSessao();
        if (conta) {
          sessaoRef.current = true;
          setUser(conta);
          carregarDadosDoUsuario(conta);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  useEffect(
    function () {
      function voltar() {
        if (user === null && authPage === 'register') {
          setAuthPage('login');
          return true;
        }
        if (user !== null && pilha.length > 1) {
          back();
          return true;
        }
        if (user !== null && route.name !== 'home') {
          go('home');
          return true;
        }
        return false;
      }
      const evento = BackHandler.addEventListener('hardwareBackPress', voltar);
      return function () {
        evento.remove();
      };
    },
    [user, authPage, pilha.length, route.name, back, go]
  );

  function abrirCadastro() {
    setLoginMessage('');
    setAuthPage('register');
  }

  function abrirLogin() {
    setAuthPage('login');
  }

  function cadastroConcluido(email, cupom) {
    setLoginEmail(email);
    let msg = 'Cadastro concluído! Digite sua senha para entrar.';
    if (cupom) {
      msg = msg + ' Use o cupom ' + cupom + ' na primeira compra.';
    }
    setLoginMessage(msg);
    setAuthPage('login');
  }

  function entrar(conta) {
    sessaoRef.current = true;
    setUser(conta);
    setPilha([{ name: 'home', params: {} }]);
    carregarDadosDoUsuario(conta);
  }

  async function logout() {
    sessaoRef.current = false;
    await sair();
    setLoginEmail('');
    setLoginMessage('');
    resetarEstado();
  }

  async function addToCart(produto, quantidade = 1) {
    await adicionarAoCarrinho(produto.id_produto, quantidade);
    await refreshCart();
  }

  async function toggleFavorite(idProduto) {
    if (!user) return;
    const jaEra = favorites.includes(idProduto);
    setFavorites(function (atuais) {
      return jaEra ? atuais.filter((i) => i !== idProduto) : [...atuais, idProduto];
    });
    try {
      if (jaEra) {
        await desfavoritar(user.id_usuario, idProduto);
      } else {
        await favoritar(user.id_usuario, idProduto);
      }
    } catch (e) {
      setFavorites(function (atuais) {
        return jaEra ? [...atuais, idProduto] : atuais.filter((i) => i !== idProduto);
      });
      Alert.alert('Favoritos', e.message);
    }
  }

  const principal = vehicles.find((v) => v.principal === 1) || vehicles[0] || null;

  const common = {
    go: go,
    replace: replace,
    back: back,
    user: user,
    cartCount: cartCount,
    refreshCart: refreshCart,
    openCart: function () {
      go('cart');
    },
    favorites: favorites,
    toggleFavorite: toggleFavorite,
    addToCart: addToCart,
    vehicles: vehicles,
    vehicle: principal,
    refreshVehicles: refreshVehicles,
  };

  let page;
  if (carregando) {
    page = <Loading text="Carregando..." />;
  } else if (user === null) {
    if (authPage === 'register') {
      page = <RegisterScreen onBack={abrirLogin} onCreated={cadastroConcluido} />;
    } else {
      page = (
        <LoginScreen
          initialEmail={loginEmail}
          message={loginMessage}
          onRegister={abrirCadastro}
          onLogin={entrar}
        />
      );
    }
  } else {
    const tela = route.name;
    const dados = route.params;
    if (tela === 'catalog') {
      page = (
        <Catalog
          {...common}
          key={'catalog-' + (dados.category || 'todos') + '-' + (dados.search || '')}
          initialCategory={dados.category || null}
          initialSearch={dados.search || ''}
        />
      );
    } else if (tela === 'detail') {
      page = <Detail {...common} key={dados.productId} productId={dados.productId} />;
    } else if (tela === 'cart') {
      page = <Cart {...common} />;
    } else if (tela === 'checkout') {
      page = <Checkout {...common} />;
    } else if (tela === 'payment') {
      page = <Payment {...common} order={dados.order} />;
    } else if (tela === 'confirmation') {
      page = <Confirmation {...common} orderId={dados.orderId} />;
    } else if (tela === 'profile') {
      page = <Profile {...common} onLogout={logout} />;
    } else {
      page = <Home {...common} />;
    }
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {page}
    </SafeAreaProvider>
  );
}
