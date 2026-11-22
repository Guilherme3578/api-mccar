import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { COLORS } from './styles/theme';
import { Loading } from './components/ui';
import { definirAoExpirar } from './services/api';
import { restaurarSessao, sair } from './services/auth';
import { meuCarrinho, adicionarAoCarrinho } from './services/shop';
import { listarFavoritos, favoritar, desfavoritar, listarVeiculos } from './services/account';
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
import AdminProducts from './screens/admin-products-screen';
import AdminProductForm from './screens/admin-product-form-screen';
import Contact from './screens/contact-screen';

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [authScreen, setAuthScreen] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [stack, setStack] = useState([{ name: 'home', params: {}, key: 0 }]);
  const [cartCount, setCartCount] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const chave = useRef(1);

  const vehicle = vehicles.find((v) => v.principal === 1) || vehicles[0] || null;

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

  const refreshFavorites = useCallback(
    async function () {
      if (!user) return;
      try {
        const lista = await listarFavoritos(user.id_usuario);
        setFavorites(lista.map((p) => p.id_produto));
      } catch (e) {}
    },
    [user]
  );

  const entrar = useCallback(function (usuario) {
    setUser(usuario);
    setStack([{ name: 'home', params: {}, key: chave.current++ }]);
    setLoginMessage('');
  }, []);

  const logout = useCallback(async function (mensagem) {
    await sair();
    setUser(null);
    setCartCount(0);
    setFavorites([]);
    setVehicles([]);
    setAuthScreen('login');
    setLoginMessage(typeof mensagem === 'string' ? mensagem : '');
  }, []);

  useEffect(
    function () {
      definirAoExpirar(function () {
        logout('Sua sessão expirou. Entre novamente.');
      });
    },
    [logout]
  );

  useEffect(function () {
    restaurarSessao()
      .then(function (usuario) {
        if (usuario) setUser(usuario);
      })
      .catch(function () {})
      .finally(function () {
        setBooting(false);
      });
  }, []);

  useEffect(
    function () {
      if (!user) return;
      refreshCart();
      refreshVehicles();
      refreshFavorites();
    },
    [user, refreshCart, refreshVehicles, refreshFavorites]
  );

  const go = useCallback(function (name, params = {}, opcoes = {}) {
    const tela = { name: name, params: params, key: chave.current++ };
    setStack(function (atual) {
      if (opcoes.reset) {
        return name === 'home' ? [tela] : [{ name: 'home', params: {}, key: atual[0].key }, tela];
      }
      if (opcoes.replace) return atual.slice(0, -1).concat(tela);
      return atual.concat(tela);
    });
  }, []);

  const back = useCallback(function () {
    setStack(function (atual) {
      return atual.length > 1 ? atual.slice(0, -1) : atual;
    });
  }, []);

  useEffect(
    function () {
      const assinatura = BackHandler.addEventListener('hardwareBackPress', function () {
        if (!user) {
          if (authScreen === 'register') {
            setAuthScreen('login');
            return true;
          }
          return false;
        }
        if (stack.length > 1) {
          back();
          return true;
        }
        return false;
      });
      return () => assinatura.remove();
    },
    [user, authScreen, stack, back]
  );

  const toggleFavorite = useCallback(
    async function (idProduto) {
      const era = favorites.includes(idProduto);
      setFavorites(era ? favorites.filter((id) => id !== idProduto) : favorites.concat(idProduto));
      try {
        if (era) await desfavoritar(user.id_usuario, idProduto);
        else await favoritar(user.id_usuario, idProduto);
      } catch (e) {
        refreshFavorites();
        Alert.alert('Favoritos', e.message);
      }
    },
    [favorites, user, refreshFavorites]
  );

  const addToCart = useCallback(
    async function (produto, quantidade) {
      await adicionarAoCarrinho(produto.id_produto, quantidade);
      await refreshCart();
    },
    [refreshCart]
  );

  if (!fontsLoaded || booting) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: COLORS.white }}>
          <Loading />
        </View>
      </SafeAreaProvider>
    );
  }

  let tela;
  if (!user) {
    tela =
      authScreen === 'register' ? (
        <RegisterScreen
          onBack={() => setAuthScreen('login')}
          onCreated={function (email, cupom) {
            setLoginEmail(email);
            setLoginMessage(
              'Conta criada! Entre para continuar.' + (cupom ? ' Use o cupom ' + cupom.codigo + ' na primeira compra.' : '')
            );
            setAuthScreen('login');
          }}
        />
      ) : (
        <LoginScreen
          key={loginEmail + loginMessage}
          initialEmail={loginEmail}
          message={loginMessage}
          onLogin={entrar}
          onRegister={() => setAuthScreen('register')}
        />
      );
  } else {
    const atual = stack[stack.length - 1];
    const p = atual.params || {};
    const comum = { user, go, back, cartCount, refreshCart, vehicle, vehicles, refreshVehicles, favorites, toggleFavorite };
    switch (atual.name) {
      case 'catalog':
        tela = (
          <Catalog
            key={atual.key}
            {...comum}
            initialCategory={p.category || null}
            initialSearch={p.search || ''}
            onlyFavorites={!!p.favorites}
            autoFocus={!!p.focus}
          />
        );
        break;
      case 'detail':
        tela = <Detail key={atual.key} {...comum} productId={p.productId} addToCart={addToCart} />;
        break;
      case 'cart':
        tela = <Cart key={atual.key} {...comum} />;
        break;
      case 'checkout':
        tela = <Checkout key={atual.key} {...comum} />;
        break;
      case 'payment':
        tela = <Payment key={atual.key} {...comum} order={p.order} preference={p.preference} />;
        break;
      case 'confirmation':
        tela = <Confirmation key={atual.key} {...comum} orderId={p.orderId} />;
        break;
      case 'profile':
        tela = <Profile key={atual.key} {...comum} onLogout={logout} onUserUpdated={setUser} openOrder={p.openOrder} />;
        break;
      case 'admin-products':
        tela = <AdminProducts key={atual.key} {...comum} />;
        break;
      case 'admin-product-form':
        tela = <AdminProductForm key={atual.key} {...comum} productId={p.productId} />;
        break;
      case 'contact':
        tela = <Contact key={atual.key} {...comum} />;
        break;
      default:
        tela = <Home key={atual.key} {...comum} />;
    }
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {tela}
    </SafeAreaProvider>
  );
}
