import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles/theme';
import { Field, FormMessage } from './auth-form';
import { PrimaryButton } from './ui';
import { criarEndereco } from '../services/account';
import { mascaraCep } from '../utils/format';

const VAZIO = { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '' };

export default function AddressForm({ principal, onSaved, onCancel }) {
  const [e, setE] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  function set(chave, valor) {
    setE({ ...e, [chave]: valor });
  }

  async function salvar() {
    if (!e.logradouro.trim() || !e.numero.trim() || !e.bairro.trim() || !e.cidade.trim()) {
      return setErro('Preencha rua, número, bairro e cidade.');
    }
    if (e.uf.trim().length !== 2) return setErro('UF deve ter 2 letras.');
    if (e.cep.replace(/\D/g, '').length !== 8) return setErro('CEP deve ter 8 dígitos.');
    setBusy(true);
    setErro('');
    try {
      await criarEndereco({ ...e, principal: principal ? 1 : 0 });
      onSaved();
    } catch (err) {
      setErro(err.message);
      setBusy(false);
    }
  }

  return (
    <View>
      <Field label="CEP" placeholder="00000-000" keyboardType="number-pad" value={e.cep} onChangeText={(t) => set('cep', mascaraCep(t))} />
      <Field label="Rua / Avenida" value={e.logradouro} onChangeText={(t) => set('logradouro', t)} />
      <View style={[styles.row, { gap: 10 }]}>
        <View style={{ width: 110 }}>
          <Field label="Número" keyboardType="number-pad" value={e.numero} onChangeText={(t) => set('numero', t)} />
        </View>
        <View style={styles.flex}>
          <Field label="Complemento" placeholder="Opcional" value={e.complemento} onChangeText={(t) => set('complemento', t)} />
        </View>
      </View>
      <Field label="Bairro" value={e.bairro} onChangeText={(t) => set('bairro', t)} />
      <View style={[styles.row, { gap: 10 }]}>
        <View style={styles.flex}>
          <Field label="Cidade" value={e.cidade} onChangeText={(t) => set('cidade', t)} />
        </View>
        <View style={{ width: 80 }}>
          <Field label="UF" maxLength={2} autoCapitalize="characters" value={e.uf} onChangeText={(t) => set('uf', t.toUpperCase())} />
        </View>
      </View>
      <FormMessage>{erro}</FormMessage>
      <View style={{ marginTop: 16, gap: 10 }}>
        <PrimaryButton label={busy ? 'Salvando...' : 'Salvar endereço'} disabled={busy} onPress={salvar} />
        <PrimaryButton label="Cancelar" variant="secondary" onPress={onCancel} />
      </View>
    </View>
  );
}
