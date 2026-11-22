import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { AuthLayout, Field, FormMessage, OrDivider, Terms } from '../components/auth-form';
import { PrimaryButton } from '../components/ui';
import { login } from '../services/auth';

export default function LoginScreen({ onLogin, onRegister, initialEmail = '', message = '' }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);

  async function submit() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Não foi possível entrar. Tente novamente.');
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Criar uma conta" subtitle="Insira seu e-mail para se cadastrar ou entrar">
      <FormMessage success>{message}</FormMessage>
      <Field
        placeholder="email@dominio.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!busy}
        returnKeyType="next"
        accessibilityLabel="E-mail"
      />
      <Field
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secret
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        editable={!busy}
        returnKeyType="go"
        onSubmitEditing={submit}
        accessibilityLabel="Senha"
        style={{ marginTop: 11 }}
      />
      <FormMessage>{error}</FormMessage>
      <View style={{ marginTop: 28 }}>
        <PrimaryButton label={busy ? 'Entrando...' : 'Continuar'} loading={busy} onPress={submit} />
      </View>
      <OrDivider />
      <PrimaryButton label="Cadastre-se" variant="secondary" disabled={busy} onPress={onRegister} />
      <Terms />
    </AuthLayout>
  );
}
