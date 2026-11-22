import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { styles } from '../styles/theme';
import { ScreenShell, TopBar, IconButton, Chip, Toggle, PrimaryButton, Loading, ErrorState } from '../components/ui';
import { Field, FormMessage } from '../components/auth-form';
import { listarCategorias, detalharProduto, criarProduto, atualizarProduto, removerProduto } from '../services/catalog';
import { brl, centavosDoTexto, mascaraMoeda } from '../utils/format';

const VAZIO = {
  id_categoria: null,
  codigo: '',
  nome: '',
  marca: '',
  descricao: '',
  preco: '',
  garantia_meses: '',
  prazo_envio_horas: '24',
  frete_gratis: '',
  imagem_uri: '',
  destaque: false,
  ativo: true,
};

function doProduto(p) {
  return {
    id_categoria: p.id_categoria,
    codigo: p.codigo || '',
    nome: p.nome || '',
    marca: p.marca || '',
    descricao: p.descricao || '',
    preco: p.preco_centavos ? brl(p.preco_centavos) : '',
    garantia_meses: String(p.garantia_meses ?? ''),
    prazo_envio_horas: String(p.prazo_envio_horas ?? ''),
    frete_gratis: p.frete_gratis_acima_centavos ? brl(p.frete_gratis_acima_centavos) : '',
    imagem_uri: p.imagem_uri || '',
    destaque: p.destaque === 1,
    ativo: p.ativo !== 0,
  };
}

export function validarProduto(f) {
  if (!f.id_categoria) return 'Escolha uma categoria.';
  if (!f.codigo.trim()) return 'Informe o código do produto.';
  if (f.nome.trim().length < 3) return 'Informe o nome do produto.';
  if (!f.marca.trim()) return 'Informe a marca.';
  if (f.descricao.trim().length < 10) return 'A descrição deve ter pelo menos 10 caracteres.';
  if (centavosDoTexto(f.preco) <= 0) return 'Informe um preço maior que zero.';
  if (f.imagem_uri.trim() && !/^https?:\/\//i.test(f.imagem_uri.trim())) return 'A URL da imagem deve começar com http:// ou https://.';
  return '';
}

export function paraApi(f) {
  return {
    id_categoria: f.id_categoria,
    codigo: f.codigo.trim().toUpperCase(),
    nome: f.nome.trim(),
    marca: f.marca.trim(),
    descricao: f.descricao.trim(),
    preco_centavos: centavosDoTexto(f.preco),
    garantia_meses: Number(f.garantia_meses) || 0,
    prazo_envio_horas: Number(f.prazo_envio_horas) || 0,
    frete_gratis_acima_centavos: centavosDoTexto(f.frete_gratis),
    imagem_uri: f.imagem_uri.trim() || null,
    destaque: f.destaque ? 1 : 0,
    ativo: f.ativo ? 1 : 0,
  };
}

function LinhaToggle({ titulo, subtitulo, value, onChange }) {
  return (
    <View style={[styles.rowBetween, { marginTop: 16, gap: 12 }]}>
      <View style={styles.flex}>
        <Text style={styles.bodyMedium}>{titulo}</Text>
        <Text style={styles.smallMuted}>{subtitulo}</Text>
      </View>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}

export default function AdminProductForm({ back, productId }) {
  const editando = !!productId;
  const [form, setForm] = useState(VAZIO);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(
    async function () {
      setLoadError('');
      setLoading(true);
      try {
        const r = await Promise.all([listarCategorias(), editando ? detalharProduto(productId) : Promise.resolve(null)]);
        setCategorias(r[0]);
        if (r[1]) setForm(doProduto(r[1]));
      } catch (e) {
        setLoadError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [editando, productId]
  );

  useEffect(
    function () {
      carregar();
    },
    [carregar]
  );

  function mudar(chave, valor) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
  }

  async function salvar() {
    const problema = validarProduto(form);
    if (problema) return setErro(problema);
    setErro('');
    setSalvando(true);
    try {
      if (editando) await atualizarProduto(productId, paraApi(form));
      else await criarProduto(paraApi(form));
      Alert.alert('Produtos', editando ? 'Produto atualizado.' : 'Produto cadastrado.');
      back();
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  }

  function excluir() {
    Alert.alert('Excluir produto', 'Excluir "' + form.nome + '"? Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async function () {
          try {
            await removerProduto(productId);
            back();
          } catch (e) {
            Alert.alert('Excluir produto', 'Não foi possível excluir: ' + e.message + ' Você pode desativar o produto em vez de excluir.');
          }
        },
      },
    ]);
  }

  const titulo = editando ? 'Editar produto' : 'Novo produto';

  if (loading || loadError) {
    return (
      <ScreenShell tabs={false}>
        <TopBar title={titulo} onBack={back} />
        {loadError ? <ErrorState message={loadError} onRetry={carregar} /> : <Loading />}
      </ScreenShell>
    );
  }

  return (
    <ScreenShell tabs={false}>
      <TopBar
        title={titulo}
        onBack={back}
        right={editando ? <IconButton icon="trash-2" label="Excluir produto" onPress={excluir} /> : null}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Categoria</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categorias.map(function (c) {
              return (
                <Chip
                  key={c.id_categoria}
                  label={c.nome}
                  icon={c.icone || 'car-cog'}
                  active={form.id_categoria === c.id_categoria}
                  onPress={() => mudar('id_categoria', c.id_categoria)}
                />
              );
            })}
          </View>

          <View style={[styles.row, { gap: 10 }]}>
            <Field
              label="Código"
              placeholder="MC-023"
              autoCapitalize="characters"
              value={form.codigo}
              onChangeText={(t) => mudar('codigo', t)}
              style={{ width: 130 }}
            />
            <Field label="Marca" placeholder="Bosch" value={form.marca} onChangeText={(t) => mudar('marca', t)} style={styles.flex} />
          </View>
          <Field label="Nome" placeholder="Pastilha de Freio Dianteira" value={form.nome} onChangeText={(t) => mudar('nome', t)} />
          <Field
            label="Descrição"
            placeholder="Detalhes, material e indicação de uso"
            value={form.descricao}
            onChangeText={(t) => mudar('descricao', t)}
            multiline
            inputStyle={{ minHeight: 96, textAlignVertical: 'top', paddingVertical: 12 }}
          />
          <View style={[styles.row, { gap: 10 }]}>
            <Field
              label="Preço"
              placeholder="R$ 0,00"
              keyboardType="number-pad"
              value={form.preco}
              onChangeText={(t) => mudar('preco', mascaraMoeda(t))}
              style={styles.flex}
            />
            <Field
              label="Garantia (meses)"
              placeholder="12"
              keyboardType="number-pad"
              value={form.garantia_meses}
              onChangeText={(t) => mudar('garantia_meses', t.replace(/\D/g, ''))}
              style={styles.flex}
            />
          </View>
          <View style={[styles.row, { gap: 10 }]}>
            <Field
              label="Envio em (horas)"
              placeholder="24"
              keyboardType="number-pad"
              value={form.prazo_envio_horas}
              onChangeText={(t) => mudar('prazo_envio_horas', t.replace(/\D/g, ''))}
              style={styles.flex}
            />
            <Field
              label="Frete grátis acima de"
              placeholder="R$ 100,00"
              keyboardType="number-pad"
              value={form.frete_gratis}
              onChangeText={(t) => mudar('frete_gratis', mascaraMoeda(t))}
              style={styles.flex}
            />
          </View>
          <Field
            label="URL da imagem (opcional)"
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
            value={form.imagem_uri}
            onChangeText={(t) => mudar('imagem_uri', t)}
          />

          <LinhaToggle
            titulo="Destaque na Home"
            subtitulo="Aparece na seção Destaques"
            value={form.destaque}
            onChange={(v) => mudar('destaque', v)}
          />
          <LinhaToggle
            titulo="Produto ativo"
            subtitulo="Inativos não aparecem no catálogo"
            value={form.ativo}
            onChange={(v) => mudar('ativo', v)}
          />

          <FormMessage>{erro}</FormMessage>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.bottomBar}>
        <PrimaryButton
          label={salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar produto'}
          loading={salvando}
          onPress={salvar}
        />
      </View>
    </ScreenShell>
  );
}
