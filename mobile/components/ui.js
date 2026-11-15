import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, styles } from '../styles/theme';
import { brl } from '../utils/format';

export function Logo() {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoBox}>
        <Text style={styles.logoLetter}>M</Text>
      </View>
      <Text style={styles.logoText}>MCCAR</Text>
    </View>
  );
}

export function CartButton({ count, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.iconBtn} hitSlop={8}>
      <Feather name="shopping-cart" size={22} color={COLORS.dark} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Header({ cartCount, openCart }) {
  return (
    <View style={styles.header}>
      <Logo />
      <CartButton count={cartCount} onPress={openCart} />
    </View>
  );
}

export function TopBar({ title, onBack, cartCount, openCart, right }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8}>
        <Feather name="chevron-left" size={26} color={COLORS.dark} />
      </Pressable>
      <Text style={styles.topTitle}>{title}</Text>
      {right ? (
        right
      ) : openCart ? (
        <CartButton count={cartCount} onPress={openCart} />
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const ABAS = [
  { id: 'home', label: 'Início', icon: 'home' },
  { id: 'catalog', label: 'Peças', icon: 'grid' },
  { id: 'cart', label: 'Carrinho', icon: 'shopping-cart' },
  { id: 'profile', label: 'Perfil', icon: 'user' },
];

export function ScreenShell({ active, go, cartCount, children }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.flex}>{children}</View>
      <View style={styles.tabBar}>
        {ABAS.map(function (aba) {
          const ativa = aba.id === active;
          return (
            <Pressable key={aba.id} style={styles.tabItem} onPress={() => go(aba.id)}>
              <View>
                <Feather name={aba.icon} size={22} color={ativa ? COLORS.yellow : COLORS.muted} />
                {aba.id === 'cart' && cartCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabLabel, ativa && styles.tabLabelActive]}>{aba.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export function ProductImage({ produto, size = 56, style }) {
  if (produto.imagem_uri) {
    return <Image source={{ uri: produto.imagem_uri }} style={[{ width: '100%', height: '100%' }, style]} resizeMode="contain" />;
  }
  return <MaterialCommunityIcons name="car-cog" size={size} color="#C8C8CC" />;
}

export function ProductCard({ product, favorite, onFavorite, onPress }) {
  return (
    <Pressable style={styles.productCard} onPress={onPress}>
      <View style={styles.productImage}>
        <ProductImage produto={product} />
        <Pressable style={styles.heart} onPress={onFavorite} hitSlop={6}>
          <MaterialCommunityIcons
            name={favorite ? 'heart' : 'heart-outline'}
            size={18}
            color={favorite ? COLORS.red : COLORS.dark}
          />
        </Pressable>
      </View>
      <Text style={styles.productBrand}>{product.marca}</Text>
      <Text style={styles.productName} numberOfLines={2}>
        {product.nome}
      </Text>
      <Text style={styles.productPrice}>{brl(product.preco_centavos)}</Text>
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, disabled, icon, variant }) {
  let estiloBtn = styles.btn;
  let estiloLabel = styles.btnLabel;
  let corIcone = COLORS.white;
  if (variant === 'secondary') {
    estiloBtn = [styles.btn, styles.btnSecondary];
    estiloLabel = styles.btnSecondaryLabel;
    corIcone = COLORS.dark;
  } else if (variant === 'yellow') {
    estiloBtn = [styles.btn, styles.btnYellow];
    estiloLabel = styles.btnYellowLabel;
    corIcone = COLORS.dark;
  }
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[estiloBtn, disabled && styles.btnDisabled]}>
      {icon ? <Feather name={icon} size={18} color={corIcone} /> : null}
      <Text style={estiloLabel}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, active, onPress, icon }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      {icon ? <Feather name={icon} size={16} color={active ? COLORS.dark : COLORS.muted} /> : null}
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function QtyStepper({ value, onChange, min = 1, max = 99, disabled }) {
  return (
    <View style={[styles.qty, disabled && styles.btnDisabled]}>
      <Pressable
        style={styles.qtyBtn}
        disabled={disabled || value <= min}
        onPress={() => onChange(value - 1)}
      >
        <Feather name="minus" size={16} color={value <= min ? COLORS.line : COLORS.dark} />
      </Pressable>
      <Text style={styles.qtyValue}>{value}</Text>
      <Pressable
        style={styles.qtyBtn}
        disabled={disabled || value >= max}
        onPress={() => onChange(value + 1)}
      >
        <Feather name="plus" size={16} color={COLORS.dark} />
      </Pressable>
    </View>
  );
}

export function Loading({ text }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.yellow} />
      {text ? <Text style={[styles.mutedText, { marginTop: 12 }]}>{text}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <Feather name="wifi-off" size={36} color={COLORS.muted} />
      <Text style={[styles.body, { textAlign: 'center', marginTop: 12 }]}>{message}</Text>
      {onRetry ? (
        <View style={{ marginTop: 16, width: 200 }}>
          <PrimaryButton label="Tentar novamente" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon = 'inbox', title, subtitle, action }) {
  return (
    <View style={styles.center}>
      <Feather name={icon} size={40} color="#C8C8CC" />
      <Text style={[styles.sectionTitle, { marginTop: 12, fontSize: 17 }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 6 }]}>{subtitle}</Text>
      ) : null}
      {action ? <View style={{ marginTop: 16, minWidth: 200 }}>{action}</View> : null}
    </View>
  );
}

export function SummaryLine({ label, value, total, green }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={total ? styles.totalLabel : styles.summaryLabel}>{label}</Text>
      <Text style={[total ? styles.totalValue : styles.summaryValue, green && { color: COLORS.green }]}>
        {value}
      </Text>
    </View>
  );
}

export function OrderSummary({ carrinho }) {
  const frete = carrinho.frete_centavos === 0 ? 'Grátis' : brl(carrinho.frete_centavos);
  return (
    <View style={styles.card}>
      <SummaryLine label="Subtotal" value={brl(carrinho.subtotal_centavos)} />
      {carrinho.desconto_centavos > 0 ? (
        <SummaryLine label={'Desconto' + (carrinho.cupom ? ' (' + carrinho.cupom.codigo + ')' : '')} value={'- ' + brl(carrinho.desconto_centavos)} green />
      ) : null}
      <SummaryLine label="Frete estimado" value={frete} green={carrinho.frete_centavos === 0} />
      <View style={styles.divider} />
      <SummaryLine label="Total" value={brl(carrinho.total_centavos)} total />
    </View>
  );
}

export function Sheet({ visible, title, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.flex} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.rowBetween}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={22} color={COLORS.dark} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function SelectRow({ active, icon, title, subtitle, onPress, right }) {
  return (
    <Pressable onPress={onPress} style={[styles.selectRow, active && styles.selectRowActive]}>
      {icon ? <Feather name={icon} size={20} color={COLORS.yellow} /> : null}
      <View style={styles.flex}>
        <Text style={styles.body}>{title}</Text>
        {subtitle ? <Text style={styles.mutedText}>{subtitle}</Text> : null}
      </View>
      {right ? right : active ? <Feather name="check-circle" size={20} color={COLORS.yellow} /> : null}
    </Pressable>
  );
}

export function VehicleSheet({ visible, modelos, jaCadastrados, onPick, onClose, busy }) {
  const ids = jaCadastrados || [];
  return (
    <Sheet visible={visible} title="Escolha seu veículo" onClose={onClose}>
      {modelos.length === 0 ? <Text style={styles.mutedText}>Nenhum modelo cadastrado.</Text> : null}
      {modelos.map(function (m) {
        const jaTem = ids.includes(m.id_modelo_veiculo);
        return (
          <SelectRow
            key={m.id_modelo_veiculo}
            icon="truck"
            title={m.marca + ' ' + m.modelo}
            subtitle={String(m.ano) + (jaTem ? ' · já cadastrado' : '')}
            onPress={() => (jaTem || busy ? null : onPick(m))}
          />
        );
      })}
    </Sheet>
  );
}

export function statusInfo(status) {
  const mapa = {
    RASCUNHO: { label: 'Rascunho', bg: COLORS.field, fg: COLORS.muted },
    AGUARDANDO_PAGAMENTO: { label: 'Aguardando pagamento', bg: COLORS.yellowSoft, fg: '#8A6400' },
    PAGO: { label: 'Pago', bg: COLORS.greenSoft, fg: COLORS.green },
    ENVIADO: { label: 'Enviado', bg: '#E4EEFF', fg: '#2A5BD7' },
    ENTREGUE: { label: 'Entregue', bg: COLORS.greenSoft, fg: COLORS.green },
    CANCELADO: { label: 'Cancelado', bg: '#FDE8E8', fg: COLORS.red },
  };
  return mapa[status] || { label: status, bg: COLORS.field, fg: COLORS.muted };
}

export function StatusPill({ status }) {
  const info = statusInfo(status);
  return (
    <View style={[styles.statusPill, { backgroundColor: info.bg }]}>
      <Text style={[styles.statusText, { color: info.fg }]}>{info.label}</Text>
    </View>
  );
}

export { TextInput };
