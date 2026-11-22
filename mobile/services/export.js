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

export async function exportarJson() {
  const dados = await buscarRelatorio();
  const arquivo = new File(Paths.cache, nomeDoArquivo(dados && dados.gerado_em));
  arquivo.create({ overwrite: true });
  await arquivo.write(JSON.stringify(dados, null, 2));
  const compartilhou = await Sharing.isAvailableAsync();
  if (compartilhou) {
    await Sharing.shareAsync(arquivo.uri, { mimeType: 'application/json', dialogTitle: 'Exportar dados MCCAR', UTI: 'public.json' });
  }
  return { dados, uri: arquivo.uri, compartilhou };
}
