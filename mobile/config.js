import { Platform } from 'react-native';
import Constants from 'expo-constants';

function enderecoDoExpo() {
  const host = (Constants.expoConfig && Constants.expoConfig.hostUri) || '';
  const ip = host.split(':')[0];
  if (ip) return 'http://' + ip + ':3000';
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || enderecoDoExpo()).replace(/\/+$/, '');

export const CONTATO = {
  whatsapp: '5511999999999',
  telefone: '1140000000',
  telefoneTexto: '(11) 4000-0000',
  email: 'contato@mccar.com.br',
  endereco: 'Av. Tiradentes, 822 · Luz, São Paulo - SP',
  horario: 'Seg. a sex. das 8h às 18h · Sáb. das 8h às 12h',
};
