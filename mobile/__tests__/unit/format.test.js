import {
  brl,
  brlCurto,
  dataBr,
  enderecoTexto,
  prazoTexto,
  bandeiraPorNumero,
  mascaraCartao,
  mascaraValidade,
  mascaraCep,
  validadeOk,
  iniciais,
  nomeBandeira,
  centavosDoTexto,
  mascaraMoeda,
  textoMetodo,
} from '../../utils/format';

describe('moeda', () => {
  test('converte centavos em reais com separador de milhar', () => {
    expect(brl(18990)).toBe('R$ 189,90');
    expect(brl(123456789)).toBe('R$ 1.234.567,89');
    expect(brl(0)).toBe('R$ 0,00');
    expect(brl(undefined)).toBe('R$ 0,00');
  });

  test('versão curta remove os centavos zerados', () => {
    expect(brlCurto(10000)).toBe('R$ 100');
    expect(brlCurto(10050)).toBe('R$ 100,50');
  });

  test('máscara de moeda para campos de preço', () => {
    expect(centavosDoTexto('R$ 1.234,56')).toBe(123456);
    expect(centavosDoTexto('')).toBe(0);
    expect(mascaraMoeda('18990')).toBe('R$ 189,90');
    expect(mascaraMoeda('abc')).toBe('');
  });
});

describe('máscaras de entrada', () => {
  test('CEP', () => {
    expect(mascaraCep('01310100')).toBe('01310-100');
    expect(mascaraCep('0131')).toBe('0131');
    expect(mascaraCep('01310-100999')).toBe('01310-100');
  });

  test('cartão em blocos de 4 dígitos', () => {
    expect(mascaraCartao('4111111111111111')).toBe('4111 1111 1111 1111');
    expect(mascaraCartao('4111-11')).toBe('4111 11');
  });

  test('validade MM/AA', () => {
    expect(mascaraValidade('1229')).toBe('12/29');
    expect(mascaraValidade('1')).toBe('1');
  });
});

describe('validações', () => {
  test('validade do cartão', () => {
    expect(validadeOk('12/99')).toBe(true);
    expect(validadeOk('13/30')).toBe(false);
    expect(validadeOk('01/20')).toBe(false);
    expect(validadeOk('1230')).toBe(false);
  });

  test('bandeira pelo número', () => {
    expect(bandeiraPorNumero('4111 1111 1111 1111')).toBe('VISA');
    expect(bandeiraPorNumero('5500000000000004')).toBe('MASTERCARD');
    expect(bandeiraPorNumero('340000000000009')).toBe('AMEX');
    expect(bandeiraPorNumero('6363680000000000')).toBe('ELO');
    expect(bandeiraPorNumero('9999')).toBe('CARTAO');
  });

  test('nome da bandeira e do método de pagamento', () => {
    expect(nomeBandeira('VISA')).toBe('Visa');
    expect(nomeBandeira('AMEX')).toBe('Amex');
    expect(nomeBandeira(null)).toBe('Cartão');
    expect(textoMetodo({ metodo: 'CARTAO', cartao_bandeira: 'VISA', cartao_final: '1234' })).toBe('Visa •••• 1234');
    expect(textoMetodo({ metodo: 'MERCADO_PAGO' })).toBe('Mercado Pago');
    expect(textoMetodo({ metodo: 'PIX' })).toBe('Pix');
    expect(textoMetodo(null)).toBe('Ainda não pago');
  });
});

describe('textos', () => {
  test('iniciais do nome', () => {
    expect(iniciais('Carlos Andrade')).toBe('CA');
    expect(iniciais('Ana Maria da Silva')).toBe('AS');
    expect(iniciais('joão')).toBe('J');
    expect(iniciais('')).toBe('?');
  });

  test('prazo de entrega', () => {
    expect(prazoTexto(3, 5)).toBe('3 a 5 dias úteis');
    expect(prazoTexto(2, 2)).toBe('2 dias úteis');
    expect(prazoTexto(0, 0)).toBe('');
  });

  test('endereço de entrega do pedido', () => {
    const pedido = { entrega_logradouro: 'Rua das Oficinas', entrega_numero: '120', entrega_cidade: 'Santo André', entrega_uf: 'SP' };
    expect(enderecoTexto(pedido)).toBe('Rua das Oficinas, 120 · Santo André, SP');
    expect(enderecoTexto(null)).toBe('');
  });

  test('data no formato brasileiro', () => {
    expect(dataBr('2026-09-13T12:00:00')).toBe('13/09/2026');
    expect(dataBr(null)).toBe('');
  });
});
