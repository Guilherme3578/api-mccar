import React, { useRef, useState } from 'react';
import { AuthLayout, Field, FormMessage, AuthLink } from '../components/auth-form';
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
    <AuthLayout title="Entrar na sua conta" subtitle="Bem-vindo ao MercadoCar">
      <FormMessage success>{message}</FormMessage>
      <Field
        label="E-mail"
        placeholder="email@dominio.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!busy}
      />
      <Field
        label="Senha"
        placeholder="Digite sua senha"
        value={password}
        onChangeText={setPassword}
        secret
        autoCapitalize="none"
        autoComplete="current-password"
        editable={!busy}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <FormMessage>{error}</FormMessage>
      <PrimaryButton label={busy ? 'Entrando...' : 'Entrar'} disabled={busy} onPress={submit} />
      <AuthLink label="Não tenho conta • Criar cadastro" disabled={busy} onPress={onRegister} />
    </AuthLayout>
  );
}
