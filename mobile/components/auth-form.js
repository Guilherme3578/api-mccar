import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { Logo } from './ui';

export function AuthLayout({ title, subtitle, children }) {
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Logo />
          </View>
          <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.dark, textAlign: 'center' }}>{title}</Text>
          <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 6, marginBottom: 8 }]}>{subtitle}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Field({ label, secret, style, ...props }) {
  const [oculto, setOculto] = useState(true);
  return (
    <View>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.fieldBox}>
        <TextInput
          style={styles.fieldInput}
          placeholderTextColor={COLORS.muted}
          secureTextEntry={secret ? oculto : false}
          {...props}
        />
        {secret ? (
          <Pressable onPress={() => setOculto(!oculto)} hitSlop={8}>
            <Feather name={oculto ? 'eye' : 'eye-off'} size={19} color={COLORS.muted} />
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

export function AuthLink({ label, onPress, disabled }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ alignItems: 'center', marginTop: 18 }}>
      <Text style={{ fontWeight: '800', color: COLORS.dark, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
