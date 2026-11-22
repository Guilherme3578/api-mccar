const { describe, test, after } = require('node:test');
const assert = require('node:assert');
const { encerrar } = require('./ambiente');
const AppError = require('../../src/utils/AppError');
const freteService = require('../../src/services/freteService');
const cupomService = require('../../src/services/cupomService');

after(encerrar);

const resumo = (subtotal, prazoHoras = 24, itens = 1) => ({ quantidade_itens: itens, subtotal_centavos: subtotal, maior_prazo_envio_horas: prazoHoras });

describe('freteService.calcular', () => {
  test('pedido sem itens não tem frete nem prazo', () => {
    assert.deepStrictEqual(freteService.calcular(resumo(0, 0, 0), 0), { frete_centavos: 0, prazo_min_dias: 0, prazo_max_dias: 0 });
  });

  test('abaixo de R$ 100 cobra R$ 29,90', () => {
    assert.strictEqual(freteService.calcular(resumo(9999), 0).frete_centavos, 2990);
  });

  test('a partir de R$ 100 o frete é grátis', () => {
    assert.strictEqual(freteService.calcular(resumo(10000), 0).frete_centavos, 0);
    assert.strictEqual(freteService.calcular(resumo(50000), 0).frete_centavos, 0);
  });

  test('o desconto do cupom conta para o frete grátis', () => {
    assert.strictEqual(freteService.calcular(resumo(15000), 7500).frete_centavos, 2990);
    assert.strictEqual(freteService.calcular(resumo(20000), 10000).frete_centavos, 0);
  });

  test('prazo soma os dias de envio aos dias de transporte', () => {
    assert.deepStrictEqual(freteService.calcular(resumo(5000, 24), 0), { frete_centavos: 2990, prazo_min_dias: 3, prazo_max_dias: 8 });
  });

  test('horas de envio quebradas arredondam para cima', () => {
    const envio = freteService.calcular(resumo(5000, 25), 0);
    assert.strictEqual(envio.prazo_min_dias, 4);
    assert.strictEqual(freteService.calcular(resumo(5000, 0), 0).prazo_min_dias, 2);
  });
});

describe('cupomService.calcularDesconto', () => {
  const percentual = (valor, minimo = 0) => ({ codigo: 'P', tipo: 'PERCENTUAL', valor, minimo_compra_centavos: minimo });
  const fixo = (valor, minimo = 0) => ({ codigo: 'V', tipo: 'VALOR', valor, minimo_compra_centavos: minimo });

  test('sem cupom não há desconto', () => {
    assert.strictEqual(cupomService.calcularDesconto(null, 10000), 0);
  });

  test('percentual aplica a porcentagem do subtotal', () => {
    assert.strictEqual(cupomService.calcularDesconto(percentual(50), 15000), 7500);
    assert.strictEqual(cupomService.calcularDesconto(percentual(10), 12990), 1299);
  });

  test('percentual arredonda para baixo, a favor da loja', () => {
    assert.strictEqual(cupomService.calcularDesconto(percentual(50), 12995), 6497);
  });

  test('valor fixo desconta em centavos', () => {
    assert.strictEqual(cupomService.calcularDesconto(fixo(1000), 15000), 1000);
  });

  test('o desconto nunca passa do subtotal', () => {
    assert.strictEqual(cupomService.calcularDesconto(fixo(5000), 3000), 3000);
    assert.strictEqual(cupomService.calcularDesconto(percentual(100), 3000), 3000);
  });

  test('sem atingir o mínimo não há desconto', () => {
    assert.strictEqual(cupomService.calcularDesconto(fixo(1000, 50000), 49999), 0);
    assert.strictEqual(cupomService.calcularDesconto(fixo(1000, 50000), 50000), 1000);
  });
});

describe('cupomService.garantirCompraMinima', () => {
  test('passa quando o mínimo foi atingido', () => {
    assert.doesNotThrow(() => cupomService.garantirCompraMinima({ codigo: 'X', minimo_compra_centavos: 10000 }, 10000));
  });

  test('avisa o valor mínimo em reais', () => {
    assert.throws(
      () => cupomService.garantirCompraMinima({ codigo: 'MCCAR10', minimo_compra_centavos: 15000 }, 9000),
      (erro) => erro instanceof AppError && erro.status === 400 && erro.message.includes('MCCAR10') && erro.message.includes('150,00')
    );
  });
});
