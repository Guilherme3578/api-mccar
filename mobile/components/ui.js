import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, styles } from '../styles/theme';
import { brl } from '../utils/format';
import FOTOS from '../assets/produtos';

const PALAVRAS_ICONE = [
  [/freio|pastilha|disco|lona|abs/i, 'disc'],
  [/amortecedor|mola|suspens|bandeja|pivô|pivo/i, 'car-cog'],
  [/bateria|elétric|eletric|lâmpada|lampada|farol|alternador|motor de partida/i, 'lightning-bolt'],
  [/filtro/i, 'air-filter'],
  [/óleo|oleo|fluido|aditivo/i, 'oil'],
  [/bomba|radiador|termost|arrefec|mangueira/i, 'coolant-temperature'],
  [/embreagem|câmbio|cambio|transmiss/i, 'cog-outline'],
  [/vela|correia|bobina|junta|motor/i, 'engine-outline'],
  [/pneu|roda/i, 'tire'],
];

export function iconeProduto(produto) {
  if (!produto) return 'hexagon-outline';
  if (produto.categoria_icone) return produto.categoria_icone;
  const texto = (produto.nome || produto.nome_produto || '') + ' ' + (produto.categoria || '');
  const achado = PALAVRAS_ICONE.find((p) => p[0].test(texto));
  return achado ? achado[1] : 'hexagon-outline';
}

export function comIcone(produtos, categorias) {
  const mapa = {};
  categorias.forEach((c) => (mapa[c.id_categoria] = c.icone));
  return produtos.map((p) => (mapa[p.id_categoria] ? { ...p, categoria_icone: mapa[p.id_categoria] } : p));
}

export function nomeVeiculo(v) {
  if (!v) return '';
  return v.marca + ' ' + v.modelo + ' ' + v.ano;
}

export function ScreenShell({ active, go, cartCount, children, tabs = true }) {
  return (
    <SafeAreaView style={styles.screen} edges={tabs ? ['top'] : ['top', 'bottom']}>
      <View style={styles.flex}>{children}</View>
      {tabs ? <TabBar active={active} go={go} cartCount={cartCount} /> : null}
    </SafeAreaView>
  );
}

const TABS = [
  { id: 'home', label: 'Início', icon: 'home' },
  { id: 'catalog', label: 'Peças', icon: 'grid' },
  { id: 'cart', label: 'Carrinho', icon: 'shopping-cart' },
  { id: 'profile', label: 'Perfil', icon: 'user' },
];

export function TabBar({ active, go, cartCount }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map(function (tab) {
        const ativo = tab.id === active;
        const cor = ativo ? COLORS.yellow : COLORS.muted;
        return (
          <Pressable
            key={tab.id}
            style={styles.tabItem}
            onPress={() => go(tab.id, {}, { reset: true })}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={tab.label}
          >
            <View>
              <Feather name={tab.icon} size={24} color={cor} />
              {tab.id === 'cart' && cartCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabel, ativo && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Logo({ size = 'sm' }) {
  const grande = size === 'lg';
  return (
    <View style={styles.logoRow}>
      <View style={[styles.logoBox, grande && { width: 30, height: 30, borderRadius: 8 }]} />
      <Text style={[styles.logoText, grande && { fontSize: 24, letterSpacing: 0.24 }]}>MCCAR</Text>
    </View>
  );
}

export function Header({ onFavorites }) {
  return (
    <View style={styles.header}>
      <Logo />
      <Pressable onPress={onFavorites} style={styles.iconBtn} hitSlop={6} accessibilityLabel="Favoritos">
        <Feather name="heart" size={24} color={COLORS.dark} />
      </Pressable>
    </View>
  );
}

export function TopBar({ title, onBack, right, left }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.iconBtn}>
        {left ||
          (onBack ? (
            <Pressable onPress={onBack} style={styles.iconBtn} accessibilityLabel="Voltar">
              <Feather name="chevron-left" size={24} color={COLORS.dark} />
            </Pressable>
          ) : null)}
      </View>
      <Text style={styles.topTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.iconBtn}>{right}</View>
    </View>
  );
}

export function IconButton({ icon, onPress, label, color = COLORS.dark, family = 'feather', size = 24 }) {
  const Icone = family === 'mci' ? MaterialCommunityIcons : Feather;
  return (
    <Pressable onPress={onPress} style={styles.iconBtn} accessibilityLabel={label} hitSlop={4}>
      <Icone name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function ProductImage({ produto, size = 36 }) {
  const local = produto && FOTOS[produto.codigo || produto.codigo_produto];
  if (local) {
    return <Image source={local} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
  }
  if (produto && produto.imagem_uri) {
    return <Image source={{ uri: produto.imagem_uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
  }
  return <MaterialCommunityIcons name={iconeProduto(produto)} size={size} color={COLORS.placeholder} />;
}

export function ProductThumb({ produto, size = 64, iconSize = 26, radius = 10 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: COLORS.field,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <ProductImage produto={produto} size={iconSize} />
    </View>
  );
}

export function ProductCard({ product, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.productCard, style]} accessibilityRole="button">
      <View style={styles.productImage}>
        <ProductImage produto={product} size={36} />
      </View>
      <Text style={styles.productBrand} numberOfLines={1}>
        {product.marca}
      </Text>
      <Text style={styles.productName} numberOfLines={2}>
        {product.nome}
      </Text>
      <Text style={styles.productPrice}>{brl(product.preco_centavos)}</Text>
    </Pressable>
  );
}

export function Chip({ label, icon, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} accessibilityState={{ selected: !!active }}>
      {icon ? <MaterialCommunityIcons name={icon} size={18} color={COLORS.yellow} /> : null}
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

export function SearchField({ value, onChangeText, placeholder, onSubmit, autoFocus }) {
  return (
    <View style={styles.searchBox}>
      <Feather name="search" size={20} color={COLORS.placeholder} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Limpar busca">
          <Feather name="x" size={18} color={COLORS.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function QtyStepper({ value, onChange, disabled, size = 'md', min = 1, max = 99 }) {
  const pequeno = size === 'sm';
  const altura = pequeno ? 32 : 40;
  const largura = pequeno ? 88 : 110;
  const icone = pequeno ? 16 : 18;
  const menosDesabilitado = disabled || value <= min;
  const maisDesabilitado = disabled || value >= max;
  return (
    <View style={[styles.qty, { height: altura, width: largura }, disabled && { opacity: 0.6 }]}>
      <Pressable
        onPress={() => onChange(value - 1)}
        disabled={menosDesabilitado}
        style={{ width: altura - 2, height: altura - 2, alignItems: 'center', justifyContent: 'center' }}
        accessibilityLabel="Diminuir quantidade"
      >
        <Feather name="minus" size={icone} color={menosDesabilitado ? COLORS.placeholder : COLORS.dark} />
      </Pressable>
      <Text style={[styles.qtyValue, { fontSize: pequeno ? 13 : 14 }]}>{value}</Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        disabled={maisDesabilitado}
        style={{ width: altura - 2, height: altura - 2, alignItems: 'center', justifyContent: 'center' }}
        accessibilityLabel="Aumentar quantidade"
      >
        <Feather name="plus" size={icone} color={maisDesabilitado ? COLORS.placeholder : COLORS.dark} />
      </Pressable>
    </View>
  );
}

export function PrimaryButton({ label, onPress, variant = 'dark', icon, disabled, style, loading }) {
  const fundo = variant === 'secondary' ? styles.btnSecondary : variant === 'yellow' ? styles.btnYellow : null;
  const texto = variant === 'secondary' ? styles.btnSecondaryLabel : variant === 'yellow' ? styles.btnYellowLabel : null;
  const corIcone = variant === 'dark' ? COLORS.white : COLORS.dark;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, fundo, (disabled || loading) && styles.btnDisabled, pressed && { opacity: 0.85 }, style]}
      accessibilityRole="button"
    >
      {loading ? <ActivityIndicator color={corIcone} /> : icon ? <Feather name={icon} size={20} color={corIcone} /> : null}
      <Text style={[styles.btnLabel, texto]}>{label}</Text>
    </Pressable>
  );
}

export function TextLink({ label, onPress, icon, color = COLORS.muted }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={[styles.row, { gap: 6, alignSelf: 'center' }]}>
      {icon ? <Feather name={icon} size={18} color={color} /> : null}
      <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: color }}>{label}</Text>
    </Pressable>
  );
}

export function SummaryLine({ label, value, green }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, green && { color: COLORS.green }]}>{value}</Text>
    </View>
  );
}

export function TotalLine({ value }) {
  return (
    <View style={styles.totalLine}>
      <Text style={styles.totalText}>Total</Text>
      <Text style={styles.totalText}>{value}</Text>
    </View>
  );
}

export function OrderSummary({ resumo, freteLabel = 'Frete estimado', subtotalLabel = 'Subtotal', card = true }) {
  const conteudo = (
    <>
      <SummaryLine label={subtotalLabel} value={brl(resumo.subtotal_centavos)} />
      {resumo.desconto_centavos > 0 ? (
        <SummaryLine label="Desconto" value={'- ' + brl(resumo.desconto_centavos)} green />
      ) : null}
      <SummaryLine label={freteLabel} value={resumo.frete_centavos === 0 ? 'Grátis' : brl(resumo.frete_centavos)} />
      <TotalLine value={brl(resumo.total_centavos)} />
    </>
  );
  if (!card) return <View>{conteudo}</View>;
  return <View style={[styles.card, { paddingVertical: 12 }]}>{conteudo}</View>;
}

export function InfoRow({ icon, iconFamily, label, value, subtitle, placeholder, onPress, last, valueColumn = 120, chevron }) {
  const temIcone = !!icon;
  const Icone = iconFamily === 'mci' ? MaterialCommunityIcons : Feather;
  const corpo = (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      {temIcone ? (
        <View style={styles.infoIcon}>
          <Icone name={icon} size={22} color={COLORS.yellow} />
        </View>
      ) : null}
      <View style={{ width: valueColumn - 16 - (temIcone ? 36 : 0) }}>
        <Text style={styles.eyebrow}>{label}</Text>
      </View>
      <View style={styles.flex}>
        <Text style={[styles.infoValue, placeholder && { color: COLORS.placeholder }]}>{value}</Text>
        {subtitle ? <Text style={[styles.smallMuted, { lineHeight: 19 }]}>{subtitle}</Text> : null}
      </View>
      {chevron || onPress ? <Feather name="chevron-right" size={22} color={COLORS.muted} style={{ marginLeft: 8 }} /> : null}
    </View>
  );
  if (!onPress) return corpo;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { backgroundColor: COLORS.field }}>
      {corpo}
    </Pressable>
  );
}

export function Toggle({ value, onChange, disabled }) {
  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      style={[
        styles.toggle,
        { backgroundColor: value ? COLORS.yellow : COLORS.line, alignItems: value ? 'flex-end' : 'flex-start' },
        disabled && { opacity: 0.5 },
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!value, disabled: !!disabled }}
      hitSlop={6}
    >
      <View style={styles.toggleKnob} />
    </Pressable>
  );
}

export function Dots({ count, active }) {
  if (count < 2) return null;
  const itens = [];
  for (let i = 0; i < count; i++) {
    itens.push(<View key={i} style={[styles.dot, i === active && styles.dotActive]} />);
  }
  return <View style={styles.dots}>{itens}</View>;
}

export function Stars({ nota, size = 12 }) {
  const cheias = Math.round(nota || 0);
  const itens = [];
  for (let i = 1; i <= 5; i++) {
    itens.push(
      <MaterialCommunityIcons key={i} name={i <= cheias ? 'star' : 'star-outline'} size={size} color={COLORS.yellow} />
    );
  }
  return <View style={styles.row}>{itens}</View>;
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.yellow} />
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <Feather name="wifi-off" size={36} color={COLORS.placeholder} />
      <Text style={[styles.body, { textAlign: 'center', marginTop: 12 }]}>{message}</Text>
      {onRetry ? <PrimaryButton label="Tentar novamente" variant="secondary" onPress={onRetry} style={{ marginTop: 16, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <View style={styles.center}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: COLORS.yellowSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={icon} size={28} color={COLORS.yellow} />
      </View>
      <Text style={[styles.sectionTitle, { marginTop: 14, textAlign: 'center' }]}>{title}</Text>
      {subtitle ? <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 6 }]}>{subtitle}</Text> : null}
      {action ? <View style={{ alignSelf: 'stretch', marginTop: 20 }}>{action}</View> : null}
    </View>
  );
}

export function Sheet({ visible, title, onClose, children, scroll = true }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Fechar" />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalGrabber} />
            <View style={[styles.rowBetween, { marginBottom: 12 }]}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Fechar">
                <Feather name="x" size={22} color={COLORS.dark} />
              </Pressable>
            </View>
            {scroll ? (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {children}
              </ScrollView>
            ) : (
              children
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SelectRow({ icon, iconFamily, title, subtitle, active, onPress, right }) {
  const Icone = iconFamily === 'mci' ? MaterialCommunityIcons : Feather;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.selectRow, active && styles.selectRowActive]}>
      {icon ? <Icone name={icon} size={20} color={COLORS.yellow} /> : null}
      <View style={styles.flex}>
        <Text style={styles.bodyMedium}>{title}</Text>
        {subtitle ? <Text style={[styles.smallMuted, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : active ? <Feather name="check" size={20} color={COLORS.dark} /> : null}
    </Pressable>
  );
}

const STATUS = {
  RASCUNHO: { label: 'Rascunho', bg: COLORS.field, fg: COLORS.muted },
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando pagamento', bg: COLORS.yellowSoft, fg: COLORS.yellowText },
  PAGO: { label: 'Em processamento', bg: COLORS.yellowSoft, fg: COLORS.yellowText },
  ENVIADO: { label: 'Enviado', bg: COLORS.yellowSoft, fg: COLORS.yellowText },
  ENTREGUE: { label: 'Entregue', bg: COLORS.yellow, fg: COLORS.dark },
  CANCELADO: { label: 'Cancelado', bg: COLORS.field, fg: COLORS.muted },
};

export function StatusPill({ status }) {
  const s = STATUS[status] || { label: status, bg: COLORS.field, fg: COLORS.muted };
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

export function VehicleSheet({ visible, modelos, jaCadastrados = [], onPick, onClose, busy }) {
  const [busca, setBusca] = useState('');
  const termo = busca.trim().toLowerCase();
  const lista = modelos.filter(function (m) {
    if (!termo) return true;
    return nomeVeiculo(m).toLowerCase().includes(termo);
  });
  return (
    <Sheet visible={visible} title="Adicionar veículo" onClose={onClose}>
      <SearchField value={busca} onChangeText={setBusca} placeholder="Marca, modelo ou ano" />
      <View style={{ height: 12 }} />
      {modelos.length === 0 ? <Loading /> : null}
      {lista.map(function (m) {
        const jaTem = jaCadastrados.includes(m.id_modelo_veiculo);
        return (
          <SelectRow
            key={m.id_modelo_veiculo}
            icon="car-outline"
            iconFamily="mci"
            title={m.marca + ' ' + m.modelo}
            subtitle={String(m.ano)}
            active={jaTem}
            onPress={jaTem || busy ? undefined : () => onPick(m)}
            right={jaTem ? <Text style={styles.smallMuted}>Cadastrado</Text> : <Feather name="plus" size={20} color={COLORS.dark} />}
          />
        );
      })}
      {modelos.length > 0 && lista.length === 0 ? (
        <Text style={[styles.mutedText, { textAlign: 'center', marginVertical: 16 }]}>Nenhum modelo encontrado.</Text>
      ) : null}
    </Sheet>
  );
}
