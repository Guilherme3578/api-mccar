const { describe, test } = require('node:test');
const assert = require('node:assert');
const AppError = require('../../src/utils/AppError');
const { ehAdmin, garantirDono, idUsuarioDoFiltro } = require('../../src/utils/acesso');

const cliente = { id_usuario: 1, perfil: 'CLIENTE' };
const admin = { id_usuario: 2, perfil: 'ADMIN' };

describe('ehAdmin', () => {
  test('identifica o perfil', () => {
    assert.strictEqual(ehAdmin(admin), true);
    assert.strictEqual(ehAdmin(cliente), false);
  });
});

describe('garantirDono', () => {
  test('o dono acessa o próprio dado', () => {
    assert.doesNotThrow(() => garantirDono(cliente, 1));
  });

  test('outro cliente recebe 403', () => {
    assert.throws(() => garantirDono(cliente, 5), (erro) => erro instanceof AppError && erro.status === 403);
  });

  test('o admin acessa dados de qualquer usuário', () => {
    assert.doesNotThrow(() => garantirDono(admin, 5));
  });
});

describe('idUsuarioDoFiltro', () => {
  test('cliente sempre filtra pelo próprio id, ignorando o informado', () => {
    assert.strictEqual(idUsuarioDoFiltro(cliente, '99'), 1);
    assert.strictEqual(idUsuarioDoFiltro(cliente, undefined), 1);
  });

  test('admin pode filtrar por qualquer usuário ou ver todos', () => {
    assert.strictEqual(idUsuarioDoFiltro(admin, '99'), 99);
    assert.strictEqual(idUsuarioDoFiltro(admin, undefined), null);
  });
});
