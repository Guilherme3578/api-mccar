import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, styles } from '../styles/theme';
import { Logo } from './ui';

export function AuthLayout({ title, subtitle, onBack, children }) {
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ height: 48, justifyContent: 'center', paddingHorizontal: 8 }}>
          {onBack ? (
            <Pressable onPress={onBack} style={styles.iconBtn} accessibilityLabel="Voltar">
              <Feather name="chevron-left" size={24} color={COLORS.dark} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <Logo size="lg" />
          </View>
          <Text
            style={{
              fontFamily: FONTS.semibold,
              fontSize: 18,
              color: COLORS.dark,
              textAlign: 'center',
              marginTop: 52,
              letterSpacing: -0.08,
            }}
          >
            {title}
          </Text>
          <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 4, marginBottom: 10 }]}>{subtitle}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Field({ label, secret, style, inputStyle, ...props }) {
  const [oculto, setOculto] = useState(true);
  return (
    <View style={style}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={[styles.fieldBox, !label && { marginTop: 12 }, props.multiline && { height: undefined, minHeight: 96, alignItems: 'flex-start' }]}>
        <TextInput
          style={[styles.fieldInput, inputStyle]}
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry={secret && oculto}
          autoCorrect={false}
          {...props}
        />
        {secret ? (
          <Pressable onPress={() => setOculto(!oculto)} hitSlop={10} accessibilityLabel={oculto ? 'Mostrar senha' : 'Ocultar senha'}>
            <Feather name={oculto ? 'eye' : 'eye-off'} size={18} color={COLORS.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function FormMessage({ children, success }) {
  if (!children) return null;
  return <Text style={success ? styles.successText : styles.errorText}>{children}</Text>;
}

export function OrDivider() {
  return (
    <View style={[styles.row, { gap: 12, marginVertical: 10 }]}>
      <View style={[styles.divider, styles.flex]} />
      <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: COLORS.placeholder }}>ou</Text>
      <View style={[styles.divider, styles.flex]} />
    </View>
  );
}

export function Terms() {
  const destaque = { fontFamily: FONTS.medium, color: COLORS.dark };
  return (
    <Text
      style={{
        fontFamily: FONTS.regular,
        fontSize: 11,
        lineHeight: 16,
        color: COLORS.muted,
        textAlign: 'center',
        marginTop: 22,
        paddingHorizontal: 12,
      }}
    >
      Ao clicar em continuar, você concorda com os nossos{'\n'}
      <Text style={destaque}>Termos de Serviço</Text> e com a <Text style={destaque}>Política de Privacidade</Text>
    </Text>
  );
}
