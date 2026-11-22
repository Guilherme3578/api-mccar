import React, { useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { COLORS, styles } from '../styles/theme';
import { Field, FormMessage } from './auth-form';
import { PrimaryButton, Toggle } from './ui';
import { criarEndereco, atualizarEndereco } from '../services/account';
import { buscarCep } from '../services/cep';
import { mascaraCep } from '../utils/format';

const VAZIO = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };

function inicial(endereco) {
  if (!endereco) return VAZIO;
  return {
    cep: mascaraCep(endereco.cep || ''),
    logradouro: endereco.logradouro || '',
    numero: String(endereco.numero || ''),
    complemento: endereco.complemento || '',
    bairro: endereco.bairro || '',
    cidade: endereco.cidade || '',
    uf: endereco.uf || '',
  };
}

export function validarEndereco(e) {
  if (e.cep.replace(/\D/g, '').length !== 8) return 'CEP deve ter 8 dígitos.';
  if (!e.logradouro.trim() || !e.numero.trim() || !e.bairro.trim() || !e.cidade.trim()) {
    return 'Preencha rua, número, bairro e cidade.';
  }
  if (e.uf.trim().length !== 2) return 'UF deve ter 2 letras.';
  return '';
}

export default function AddressForm({ endereco, principal, onSaved, onCancel }) {
  const editando = !!endereco;
  const [dados, setDados] = useState(inicial(endereco));
  const [tornarPrincipal, setTornarPrincipal] = useState(editando ? endereco.principal === 1 : !!principal);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const ultimoCep = useRef(editando ? String(endereco.cep).replace(/\D/g, '') : '');

  function mudar(chave, valor) {
    setDados((atual) => ({ ...atual, [chave]: valor }));
  }

  async function mudarCep(texto) {
    const cep = mascaraCep(texto);
    mudar('cep', cep);
    const digitos = cep.replace(/\D/g, '');
    if (digitos.length !== 8 || digitos === ultimoCep.current) return;
    ultimoCep.current = digitos;
    setBuscando(true);
    setAviso('');
    setErro('');
    try {
      const achado = await buscarCep(digitos);
      setDados((atual) => ({
        ...atual,
        logradouro: achado.logradouro || atual.logradouro,
        bairro: achado.bairro || atual.bairro,
        cidade: achado.cidade || atual.cidade,
        uf: achado.uf || atual.uf,
      }));
      setAviso('Endereço preenchido pelo CEP. Confira e informe o número.');
    } catch (e) {
      setAviso(e.message + ' Preencha manualmente.');
    } finally {
      setBuscando(false);
    }
  }

  async function salvar() {
    const problema = validarEndereco(dados);
    if (problema) return setErro(problema);
    setSalvando(true);
    setErro('');
    try {
      const corpo = { ...dados, cep: dados.cep.replace(/\D/g, ''), uf: dados.uf.toUpperCase(), principal: tornarPrincipal ? 1 : 0 };
      const salvo = editando ? await atualizarEndereco(endereco.id_endereco, corpo) : await criarEndereco(corpo);
      if (!editando) setDados(VAZIO);
      onSaved(salvo);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View>
      <View style={[styles.row, { gap: 10, alignItems: 'flex-end' }]}>
        <Field
          label="CEP"
          placeholder="00000-000"
          keyboardType="number-pad"
          value={dados.cep}
          onChangeText={mudarCep}
          style={styles.flex}
          accessibilityLabel="CEP"
        />
        {buscando ? <ActivityIndicator color={COLORS.yellow} style={{ marginBottom: 14 }} /> : null}
      </View>
      {aviso ? <Text style={[styles.smallMuted, { marginTop: 6 }]}>{aviso}</Text> : null}
      <Field label="Rua / Avenida" placeholder="Rua das Oficinas" value={dados.logradouro} onChangeText={(t) => mudar('logradouro', t)} />
      <View style={[styles.row, { gap: 10 }]}>
        <Field
          label="Número"
          keyboardType="number-pad"
          value={dados.numero}
          onChangeText={(t) => mudar('numero', t)}
          style={{ width: 110 }}
          accessibilityLabel="Número"
        />
        <Field
          label="Complemento"
          placeholder="Opcional"
          value={dados.complemento}
          onChangeText={(t) => mudar('complemento', t)}
          style={styles.flex}
        />
      </View>
      <Field label="Bairro" value={dados.bairro} onChangeText={(t) => mudar('bairro', t)} />
      <View style={[styles.row, { gap: 10 }]}>
        <Field label="Cidade" value={dados.cidade} onChangeText={(t) => mudar('cidade', t)} style={styles.flex} />
        <Field
          label="UF"
          autoCapitalize="characters"
          maxLength={2}
          value={dados.uf}
          onChangeText={(t) => mudar('uf', t.toUpperCase())}
          style={{ width: 80 }}
        />
      </View>
      <View style={[styles.rowBetween, { marginTop: 16, gap: 12 }]}>
        <Text style={[styles.bodyMedium, styles.flex]}>Usar como endereço principal</Text>
        <Toggle value={tornarPrincipal} onChange={setTornarPrincipal} />
      </View>
      <FormMessage>{erro}</FormMessage>
      <View style={{ marginTop: 16, gap: 10 }}>
        <PrimaryButton
          label={salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Salvar endereço'}
          loading={salvando}
          onPress={salvar}
        />
        {onCancel ? <PrimaryButton label="Voltar" variant="secondary" onPress={onCancel} disabled={salvando} /> : null}
      </View>
    </View>
  );
}
