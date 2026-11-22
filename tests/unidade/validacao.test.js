const { describe, test } = require('node:test');
const assert = require('node:assert');
const AppError = require('../../src/utils/AppError');
const StatusPedido = require('../../src/enums/StatusPedido');
const {
  vazio,
  exigirCampos,
  selecionarCampos,
  paraId,
  paraIdOpcional,
  paraInteiro,
  paraFlag,
  paraFlagOpcional,
  paraTextoOpcional,
  paraOpcao,
} = require('../../src/utils/validacao');

function erroComStatus(status, trecho) {
  return (erro) => erro instanceof AppError && erro.status === status && (!trecho || erro.message.includes(trecho));
}

describe('vazio', () => {
  test('considera vazio undefined, null e texto vazio', () => {
    assert.strictEqual(vazio(undefined), true);
    assert.strictEqual(vazio(null), true);
    assert.strictEqual(vazio(''), true);
  });

  test('não considera vazio zero, false e espaço', () => {
    assert.strictEqual(vazio(0), false);
    assert.strictEqual(vazio(false), false);
    assert.strictEqual(vazio(' '), false);
  });
});

describe('exigirCampos', () => {
  test('passa quando todos os campos existem', () => {
    assert.doesNotThrow(() => exigirCampos({ nome: 'Ana', idade: 0 }, ['nome', 'idade']));
  });

  test('lista todos os campos que faltam na mensagem', () => {
    assert.throws(() => exigirCampos({ nome: '' }, ['nome', 'email', 'senha']), erroComStatus(400, 'nome, email, senha'));
  });

  test('aceita corpo indefinido', () => {
    assert.throws(() => exigirCampos(undefined, ['nome']), erroComStatus(400, 'nome'));
  });
});

describe('selecionarCampos', () => {
  test('mantém só os campos permitidos e informados', () => {
    const resultado = selecionarCampos({ nome: 'Ana', perfil: 'ADMIN', email: undefined }, ['nome', 'email']);
    assert.deepStrictEqual(resultado, { nome: 'Ana' });
  });

  test('impede que o cliente envie campos protegidos', () => {
    const resultado = selecionarCampos({ id_usuario: 99, status: 'PAGO', nome: 'x' }, ['nome']);
    assert.ok(!('id_usuario' in resultado) && !('status' in resultado));
  });
});

describe('paraId', () => {
  test('converte ids válidos', () => {
    assert.strictEqual(paraId('15'), 15);
    assert.strictEqual(paraId(7), 7);
  });

  for (const invalido of ['abc', '0', '-1', '1.5', '1e1', '0x10', '01', ' 1', '', null, undefined]) {
    test(`recusa ${JSON.stringify(invalido)}`, () => {
      assert.throws(() => paraId(invalido, 'id_produto'), erroComStatus(400, 'id_produto inválido'));
    });
  }
});

describe('paraIdOpcional', () => {
  test('devolve null quando vazio', () => {
    assert.strictEqual(paraIdOpcional('', 'id'), null);
    assert.strictEqual(paraIdOpcional(undefined, 'id'), null);
  });

  test('valida quando informado', () => {
    assert.strictEqual(paraIdOpcional('3', 'id'), 3);
    assert.throws(() => paraIdOpcional('x', 'id'), erroComStatus(400));
  });
});

describe('paraInteiro', () => {
  test('aceita inteiros a partir do mínimo', () => {
    assert.strictEqual(paraInteiro('0', 'quantidade'), 0);
    assert.strictEqual(paraInteiro(5, 'quantidade', 1), 5);
  });

  test('recusa abaixo do mínimo, decimal e vazio', () => {
    assert.throws(() => paraInteiro(0, 'quantidade', 1), erroComStatus(400, 'maior ou igual a 1'));
    assert.throws(() => paraInteiro('2.5', 'quantidade'), erroComStatus(400));
    assert.throws(() => paraInteiro('', 'quantidade'), erroComStatus(400));
  });
});

describe('paraFlag e paraFlagOpcional', () => {
  test('entende os formatos de verdadeiro', () => {
    for (const verdadeiro of [true, 1, '1', 'true']) assert.strictEqual(paraFlag(verdadeiro), 1);
  });

  test('qualquer outro valor vira 0', () => {
    for (const falso of [false, 0, '0', 'false', 'sim', undefined]) assert.strictEqual(paraFlag(falso), 0);
  });

  test('opcional devolve null quando vazio', () => {
    assert.strictEqual(paraFlagOpcional(''), null);
    assert.strictEqual(paraFlagOpcional('1'), 1);
  });
});

describe('paraTextoOpcional', () => {
  test('remove espaços e devolve null quando vazio', () => {
    assert.strictEqual(paraTextoOpcional('  filtro  '), 'filtro');
    assert.strictEqual(paraTextoOpcional(''), null);
  });
});

describe('paraOpcao', () => {
  test('aceita valores do enum sem diferenciar maiúsculas', () => {
    assert.strictEqual(paraOpcao(' cancelado ', StatusPedido, 'status'), StatusPedido.CANCELADO);
  });

  test('recusa valor fora do enum listando as opções', () => {
    assert.throws(() => paraOpcao('PERDIDO', StatusPedido, 'status'), erroComStatus(400, 'RASCUNHO'));
  });
});
