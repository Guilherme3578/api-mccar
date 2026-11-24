import { Alert, Platform } from 'react-native';

export function alertaNoNavegador(titulo, mensagem, botoes) {
  const texto = [titulo, mensagem].filter(Boolean).join('\n\n');
  const lista = botoes || [];
  const cancelar = lista.find((botao) => botao.style === 'cancel');
  const confirmar = lista.find((botao) => botao !== cancelar);
  if (!cancelar || !confirmar) {
    window.alert(texto);
    if (lista[0] && lista[0].onPress) lista[0].onPress();
    return;
  }
  const escolhido = window.confirm(texto) ? confirmar : cancelar;
  if (escolhido.onPress) escolhido.onPress();
}

if (Platform.OS === 'web') {
  Alert.alert = alertaNoNavegador;
}
