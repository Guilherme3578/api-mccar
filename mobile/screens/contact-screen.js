import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { ScreenShell, TopBar, Chip, PrimaryButton } from '../components/ui';
import { Field, FormMessage } from '../components/auth-form';
import { CONTATO } from '../config';

const ASSUNTOS = ['Dúvida sobre peça', 'Meu pedido', 'Troca ou devolução', 'Outro'];

const PERGUNTAS = [
  {
    pergunta: 'Como sei se a peça serve no meu carro?',
    resposta:
      'Cadastre seu veículo na tela inicial e ative "Compatível com meu veículo" na lista de peças. Na página do produto você vê todos os modelos compatíveis.',
  },
  {
    pergunta: 'Qual o prazo de entrega?',
    resposta: 'O prazo aparece no carrinho e no checkout, somando o tempo de separação da peça e o transporte até o seu endereço.',
  },
  {
    pergunta: 'Como funciona o frete grátis?',
    resposta: 'Compras a partir de R$ 100,00 em produtos têm frete grátis. Abaixo disso, o frete é calculado no carrinho.',
  },
  {
    pergunta: 'Posso trocar ou devolver uma peça?',
    resposta: 'Sim, em até 7 dias após o recebimento, com a peça sem uso e na embalagem original. Fale com a gente por aqui.',
  },
];

function Canal({ icon, family, titulo, valor, onPress }) {
  const Icone = family === 'mci' ? MaterialCommunityIcons : Feather;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.infoRow, { gap: 12 }, pressed && { backgroundColor: COLORS.field }]}
      accessibilityRole="link"
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.yellowSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icone name={icon} size={20} color={COLORS.yellowText} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.bodyMedium}>{titulo}</Text>
        <Text style={styles.smallMuted}>{valor}</Text>
      </View>
      <Feather name="chevron-right" size={22} color={COLORS.muted} />
    </Pressable>
  );
}

function Pergunta({ item, aberta, onToggle, last }) {
  return (
    <Pressable onPress={onToggle} style={[{ paddingVertical: 14 }, !last && { borderBottomWidth: 1, borderBottomColor: COLORS.line }]}>
      <View style={[styles.rowBetween, { gap: 12 }]}>
        <Text style={[styles.bodyMedium, styles.flex]}>{item.pergunta}</Text>
        <Feather name={aberta ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.muted} />
      </View>
      {aberta ? <Text style={[styles.mutedText, { marginTop: 8 }]}>{item.resposta}</Text> : null}
    </Pressable>
  );
}

export function montarMensagem(user, assunto, mensagem) {
  return 'Assunto: ' + assunto + '\nCliente: ' + user.nome + ' (' + user.email + ')\n\n' + mensagem.trim();
}

export default function Contact({ user, back }) {
  const [assunto, setAssunto] = useState(ASSUNTOS[0]);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [aberta, setAberta] = useState(-1);

  async function abrir(url, alternativa) {
    try {
      await Linking.openURL(url);
    } catch (e) {
      if (alternativa) {
        try {
          await Linking.openURL(alternativa);
          return;
        } catch (e2) {}
      }
      Alert.alert('Contato', 'Não foi possível abrir o aplicativo no seu aparelho.');
    }
  }

  function whatsapp(texto) {
    const t = encodeURIComponent(texto || 'Olá! Vim pelo app MCCAR.');
    abrir('whatsapp://send?phone=' + CONTATO.whatsapp + '&text=' + t, 'https://wa.me/' + CONTATO.whatsapp + '?text=' + t);
  }

  function email(texto, titulo) {
    abrir('mailto:' + CONTATO.email + '?subject=' + encodeURIComponent(titulo || 'Contato pelo app MCCAR') + '&body=' + encodeURIComponent(texto || ''));
  }

  function enviar(canal) {
    if (mensagem.trim().length < 10) return setErro('Escreva sua mensagem com pelo menos 10 caracteres.');
    setErro('');
    const texto = montarMensagem(user, assunto, mensagem);
    if (canal === 'whatsapp') whatsapp(texto);
    else email(texto, 'MCCAR · ' + assunto);
  }

  return (
    <ScreenShell tabs={false}>
      <TopBar title="Fale conosco" onBack={back} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.mutedText}>{CONTATO.horario}</Text>

          <View style={[styles.cardOutline, { marginTop: 12 }]}>
            <Canal icon="whatsapp" family="mci" titulo="WhatsApp" valor="Resposta mais rápida" onPress={() => whatsapp()} />
            <Canal icon="phone" titulo="Telefone" valor={CONTATO.telefoneTexto} onPress={() => abrir('tel:' + CONTATO.telefone)} />
            <Canal icon="mail" titulo="E-mail" valor={CONTATO.email} onPress={() => email()} />
            <View style={[styles.infoRow, { gap: 12, borderBottomWidth: 0 }]}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.yellowSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="map-pin" size={20} color={COLORS.yellowText} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.bodyMedium}>Loja física</Text>
                <Text style={styles.smallMuted}>{CONTATO.endereco}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Envie uma mensagem</Text>
          <Text style={styles.fieldLabel}>Assunto</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ASSUNTOS.map((a) => (
              <Chip key={a} label={a} active={assunto === a} onPress={() => setAssunto(a)} />
            ))}
          </View>
          <Field
            label="Mensagem"
            placeholder="Conte como podemos ajudar. Se for sobre um pedido, informe o número (ex.: MC-30523)."
            value={mensagem}
            onChangeText={setMensagem}
            multiline
            inputStyle={{ minHeight: 110, textAlignVertical: 'top', paddingVertical: 12 }}
          />
          <FormMessage>{erro}</FormMessage>
          <View style={[styles.row, { gap: 10, marginTop: 16 }]}>
            <PrimaryButton label="WhatsApp" icon="message-circle" onPress={() => enviar('whatsapp')} style={styles.flex} />
            <PrimaryButton label="E-mail" icon="mail" variant="secondary" onPress={() => enviar('email')} style={styles.flex} />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 28, marginBottom: 4 }]}>Perguntas frequentes</Text>
          {PERGUNTAS.map(function (item, i) {
            return (
              <Pergunta
                key={item.pergunta}
                item={item}
                aberta={aberta === i}
                last={i === PERGUNTAS.length - 1}
                onToggle={() => setAberta(aberta === i ? -1 : i)}
              />
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}
