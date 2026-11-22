import { validarEndereco } from '../../components/address-form';
import { validarProduto, paraApi } from '../../screens/admin-product-form-screen';
import { montarMensagem } from '../../screens/contact-screen';
import { resultadoMercadoPago } from '../../screens/payment-screen';
import { textoPreferencia } from '../../screens/checkout-screen';
import { iconeProduto, comIcone, nomeVeiculo } from '../../components/ui';

const ENDERECO = { cep: '09010-000', logradouro: 'Rua das Oficinas', numero: '120', bairro: 'Centro', cidade: 'Santo André', uf: 'SP' };

describe('validação de endereço', () => {
  test('aceita endereço completo', () => {
    expect(validarEndereco(ENDERECO)).toBe('');
  });

  test('recusa CEP incompleto, campos vazios e UF inválida', () => {
    expect(validarEndereco({ ...ENDERECO, cep: '0901' })).toMatch(/CEP/);
    expect(validarEndereco({ ...ENDERECO, numero: ' ' })).toMatch(/Preencha/);
    expect(validarEndereco({ ...ENDERECO, uf: 'S' })).toMatch(/UF/);
  });
});

describe('cadastro de produto (admin)', () => {
  const FORM = {
    id_categoria: 4,
    codigo: 'mc-100',
    nome: 'Pastilha de Freio',
    marca: 'Bosch',
    descricao: 'Pastilha cerâmica de baixo ruído',
    preco: 'R$ 189,90',
    garantia_meses: '12',
    prazo_envio_horas: '24',
    frete_gratis: 'R$ 100,00',
    imagem_uri: '',
    destaque: true,
    ativo: true,
  };

  test('aceita formulário válido', () => {
    expect(validarProduto(FORM)).toBe('');
  });

  test('aponta o campo inválido', () => {
    expect(validarProduto({ ...FORM, id_categoria: null })).toMatch(/categoria/);
    expect(validarProduto({ ...FORM, preco: '' })).toMatch(/preço/);
    expect(validarProduto({ ...FORM, descricao: 'curta' })).toMatch(/descrição/);
    expect(validarProduto({ ...FORM, imagem_uri: 'foto.png' })).toMatch(/URL/);
  });

  test('converte o formulário no corpo esperado pela API', () => {
    expect(paraApi(FORM)).toEqual({
      id_categoria: 4,
      codigo: 'MC-100',
      nome: 'Pastilha de Freio',
      marca: 'Bosch',
      descricao: 'Pastilha cerâmica de baixo ruído',
      preco_centavos: 18990,
      garantia_meses: 12,
      prazo_envio_horas: 24,
      frete_gratis_acima_centavos: 10000,
      imagem_uri: null,
      destaque: 1,
      ativo: 1,
    });
  });
});

describe('Mercado Pago', () => {
  test('interpreta a resposta do /sincronizar', () => {
    expect(resultadoMercadoPago({ status_pedido: 'PAGO', pagamento: { status: 'APROVADO' } })).toBe('aprovado');
    expect(resultadoMercadoPago({ status_pedido: 'AGUARDANDO_PAGAMENTO', pagamento: { status: 'RECUSADO' } })).toBe('recusado');
    expect(resultadoMercadoPago({ status_pedido: 'AGUARDANDO_PAGAMENTO', pagamento: { status: 'PENDENTE', metodo: 'BOLETO' } })).toBe('pendente');
    expect(resultadoMercadoPago({ status_pedido: 'AGUARDANDO_PAGAMENTO', pagamento: { status: 'PENDENTE', metodo: 'MERCADO_PAGO' } })).toBe('aguardando');
    expect(resultadoMercadoPago(null)).toBe('aguardando');
  });

  test('texto da forma de pagamento escolhida no checkout', () => {
    const cartoes = [{ id_cartao: 7, bandeira: 'VISA', ultimos_quatro: '1234' }];
    expect(textoPreferencia({ metodo: 'MERCADO_PAGO' }, cartoes)).toBe('Mercado Pago');
    expect(textoPreferencia({ metodo: 'CARTAO', id_cartao: 7 }, cartoes)).toBe('Visa •••• 1234');
    expect(textoPreferencia({ metodo: 'CARTAO', id_cartao: null }, cartoes)).toBe('Novo cartão de crédito');
    expect(textoPreferencia({ metodo: 'PIX' }, cartoes)).toBe('Pix');
  });
});

describe('outras regras de tela', () => {
  test('mensagem de contato inclui assunto e dados do cliente', () => {
    const texto = montarMensagem({ nome: 'Carlos', email: 'c@x.com' }, 'Meu pedido', '  Onde está o MC-1?  ');
    expect(texto).toBe('Assunto: Meu pedido\nCliente: Carlos (c@x.com)\n\nOnde está o MC-1?');
  });

  test('ícone do produto vem da categoria ou do nome', () => {
    expect(iconeProduto({ nome: 'Qualquer', categoria_icone: 'engine' })).toBe('engine');
    expect(iconeProduto({ nome: 'Pastilha de Freio Dianteira' })).toBe('disc');
    expect(iconeProduto({ nome: 'Bateria 60Ah' })).toBe('lightning-bolt');
    expect(iconeProduto({ nome: 'Item desconhecido' })).toBe('hexagon-outline');
    expect(comIcone([{ id_produto: 1, id_categoria: 2 }], [{ id_categoria: 2, icone: 'cog' }])[0].categoria_icone).toBe('cog');
  });

  test('nome do veículo', () => {
    expect(nomeVeiculo({ marca: 'Volkswagen', modelo: 'Gol', ano: 2019 })).toBe('Volkswagen Gol 2019');
  });
});
