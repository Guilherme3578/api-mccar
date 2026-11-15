import React, { useRef, useState } from 'react';
import { AuthLayout, Field, FormMessage, AuthLink } from '../components/auth-form';
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
    if (!nome.trim()) return setError('Informe o seu nome.');
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
    <AuthLayout title="Criar uma conta" subtitle="Preencha seus dados para começar">
      <Field label="Nome" placeholder="Seu nome" value={nome} onChangeText={setNome} editable={!busy} autoComplete="name" />
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
        placeholder="Mínimo de 6 caracteres"
        value={senha}
        onChangeText={setSenha}
        secret
        autoCapitalize="none"
        editable={!busy}
      />
      <Field
        label="Confirmar senha"
        placeholder="Digite a senha novamente"
        value={confirmar}
        onChangeText={setConfirmar}
        secret
        autoCapitalize="none"
        editable={!busy}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <FormMessage>{error}</FormMessage>
      <PrimaryButton label={busy ? 'Criando...' : 'Criar conta'} disabled={busy} onPress={submit} />
      <AuthLink label="Já tenho conta • Entrar" disabled={busy} onPress={onBack} />
    </AuthLayout>
  );
}
