import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { AuthLayout, Field, FormMessage, OrDivider, Terms } from '../components/auth-form';
import { PrimaryButton } from '../components/ui';
import { cadastrar } from '../services/auth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ onBack, onCreated }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);

  async function submit() {
    if (locked.current) return;
    if (!nome.trim()) return setError('Informe o seu nome completo.');
    if (!EMAIL.test(email.trim())) return setError('Informe um e-mail válido.');
    if (senha.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.');
    if (senha !== confirmar) return setError('As senhas não conferem.');

    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const criado = await cadastrar(nome, email, senha);
      onCreated(email.trim().toLowerCase(), criado.cupom_boas_vindas);
    } catch (err) {
      setError(err.message || 'Não foi possível criar a conta.');
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Criar sua conta" subtitle="Preencha seus dados para criar seu cadastro" onBack={onBack}>
      <Field
        placeholder="Nome completo"
        value={nome}
        onChangeText={setNome}
        editable={!busy}
        autoComplete="name"
        autoCapitalize="words"
        accessibilityLabel="Nome completo"
      />
      <Field
        placeholder="email@dominio.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!busy}
        accessibilityLabel="E-mail"
      />
      <Field
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secret
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!busy}
        accessibilityLabel="Senha"
      />
      <Field
        placeholder="Confirmar senha"
        value={confirmar}
        onChangeText={setConfirmar}
        secret
        autoCapitalize="none"
        editable={!busy}
        returnKeyType="go"
        onSubmitEditing={submit}
        accessibilityLabel="Confirmar senha"
      />
      <FormMessage>{error}</FormMessage>
      <View style={{ marginTop: 20 }}>
        <PrimaryButton label={busy ? 'Criando...' : 'Criar conta'} loading={busy} onPress={submit} />
      </View>
      <OrDivider />
      <PrimaryButton label="Login" variant="secondary" disabled={busy} onPress={onBack} />
      <Terms />
    </AuthLayout>
  );
}
