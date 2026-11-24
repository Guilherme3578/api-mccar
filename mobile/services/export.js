import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { api } from './api';

export function buscarRelatorio() {
  return api.get('/relatorios/dados');
}

export function nomeDoArquivo(geradoEm) {
  const data = new Date(geradoEm || Date.now());
  const carimbo = isNaN(data.getTime()) ? String(Date.now()) : data.toISOString().slice(0, 19).replace(/[-:T]/g, '');
  return 'mccar-dados-' + carimbo + '.json';
}

function baixarNoNavegador(nome, conteudo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportarJson() {
  const dados = await buscarRelatorio();
  const nome = nomeDoArquivo(dados && dados.gerado_em);
  const conteudo = JSON.stringify(dados, null, 2);
  if (Platform.OS === 'web') {
    baixarNoNavegador(nome, conteudo);
    return { dados, uri: nome, compartilhou: true };
  }
  const arquivo = new File(Paths.cache, nome);
  arquivo.create({ overwrite: true });
  await arquivo.write(conteudo);
  const compartilhou = await Sharing.isAvailableAsync();
  if (compartilhou) {
    await Sharing.shareAsync(arquivo.uri, { mimeType: 'application/json', dialogTitle: 'Exportar dados MCCAR', UTI: 'public.json' });
  }
  return { dados, uri: arquivo.uri, compartilhou };
}
