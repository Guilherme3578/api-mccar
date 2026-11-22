const { describe, test, after } = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('node:events');
const jwt = require('jsonwebtoken');
const { encerrar } = require('./ambiente');
const AppError = require('../../src/utils/AppError');
const authGuard = require('../../src/guards/authGuard');
const adminGuard = require('../../src/guards/adminGuard');
const limiteLoginGuard = require('../../src/guards/limiteLoginGuard');
const errorHandler = require('../../src/guards/errorHandler');
const usuarioService = require('../../src/services/usuarioService');
const usuarioRepository = require('../../src/repositories/usuarioRepository');

after(encerrar);

function respostaFalsa() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.headers = {};
  res.corpo = undefined;
  res.status = (codigo) => {
    res.statusCode = codigo;
    return res;
  };
  res.json = (corpo) => {
    res.corpo = corpo;
    return res;
  };
  res.set = (nome, valor) => {
    res.headers[nome] = valor;
    return res;
  };
  return res;
}

const comStatus = (status) => (erro) => erro instanceof AppError && erro.status === status;
const assinar = (payload, opcoes = {}) => jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', ...opcoes });

describe('authGuard', () => {
  const criado = usuarioService.criar({ nome: 'Guard', email: 'guard@teste.com', senha: '123456' });

  test('sem header Authorization devolve 401', () => {
    assert.throws(() => authGuard({ headers: {} }, respostaFalsa(), () => {}), comStatus(401));
  });

  test('header sem "Bearer" devolve 401', () => {
    assert.throws(() => authGuard({ headers: { authorization: `Token ${assinar({ id_usuario: criado.id_usuario })}` } }, respostaFalsa(), () => {}), comStatus(401));
  });

  test('token válido carrega o usuário do banco e chama o próximo', () => {
    const req = { headers: { authorization: `Bearer ${assinar({ id_usuario: criado.id_usuario })}` } };
    let chamou = false;
    authGuard(req, respostaFalsa(), () => {
      chamou = true;
    });
    assert.ok(chamou);
    assert.strictEqual(req.usuario.email, 'guard@teste.com');
    assert.ok(!('senha_hash' in req.usuario));
  });

  test('token assinado com outro segredo devolve 401', () => {
    const falso = jwt.sign({ id_usuario: criado.id_usuario }, 'outro-segredo-qualquer-com-tamanho-suficiente');
    assert.throws(() => authGuard({ headers: { authorization: `Bearer ${falso}` } }, respostaFalsa(), () => {}), comStatus(401));
  });

  test('token expirado devolve 401', () => {
    const expirado = assinar({ id_usuario: criado.id_usuario, exp: Math.floor(Date.now() / 1000) - 60 });
    assert.throws(() => authGuard({ headers: { authorization: `Bearer ${expirado}` } }, respostaFalsa(), () => {}), comStatus(401));
  });

  test('token com alg none devolve 401', () => {
    const cabecalho = Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url');
    const corpo = Buffer.from(JSON.stringify({ id_usuario: criado.id_usuario })).toString('base64url');
    assert.throws(() => authGuard({ headers: { authorization: `Bearer ${cabecalho}.${corpo}.` } }, respostaFalsa(), () => {}), comStatus(401));
  });

  test('token de usuário excluído devolve 401', () => {
    const outro = usuarioService.criar({ nome: 'Some', email: 'some@teste.com', senha: '123456' });
    const token = assinar({ id_usuario: outro.id_usuario });
    usuarioRepository.remover(outro.id_usuario);
    assert.throws(() => authGuard({ headers: { authorization: `Bearer ${token}` } }, respostaFalsa(), () => {}), comStatus(401));
  });
});

describe('adminGuard', () => {
  test('cliente recebe 403', () => {
    assert.throws(() => adminGuard({ usuario: { perfil: 'CLIENTE' } }, respostaFalsa(), () => {}), comStatus(403));
  });

  test('sem usuário logado recebe 403', () => {
    assert.throws(() => adminGuard({}, respostaFalsa(), () => {}), comStatus(403));
  });

  test('admin passa', () => {
    let chamou = false;
    adminGuard({ usuario: { perfil: 'ADMIN' } }, respostaFalsa(), () => {
      chamou = true;
    });
    assert.ok(chamou);
  });
});

describe('limiteLoginGuard', () => {
  function tentativa(email, statusDaResposta, ip = '10.0.0.1') {
    const res = respostaFalsa();
    limiteLoginGuard({ ip, body: { email } }, res, () => {});
    res.statusCode = statusDaResposta;
    res.emit('finish');
    return res;
  }

  test('bloqueia na 6ª tentativa depois de 5 erros, com Retry-After', () => {
    for (let i = 0; i < 5; i++) tentativa('alvo@teste.com', 401);
    const res = respostaFalsa();
    assert.throws(() => limiteLoginGuard({ ip: '10.0.0.1', body: { email: 'alvo@teste.com' } }, res, () => {}), comStatus(429));
    assert.ok(Number(res.headers['Retry-After']) > 0);
  });

  test('o bloqueio vale por e-mail e IP, sem afetar os outros', () => {
    assert.doesNotThrow(() => tentativa('outro@teste.com', 401));
    assert.doesNotThrow(() => tentativa('alvo@teste.com', 401, '10.0.0.2'));
  });

  test('e-mail com maiúsculas conta como o mesmo', () => {
    assert.throws(() => limiteLoginGuard({ ip: '10.0.0.1', body: { email: '  ALVO@teste.com ' } }, respostaFalsa(), () => {}), comStatus(429));
  });

  test('um login certo zera a contagem', () => {
    for (let i = 0; i < 4; i++) tentativa('zera@teste.com', 401);
    tentativa('zera@teste.com', 200);
    for (let i = 0; i < 4; i++) tentativa('zera@teste.com', 401);
    assert.doesNotThrow(() => tentativa('zera@teste.com', 401));
  });

  test('erros que não são 401 não contam', () => {
    for (let i = 0; i < 6; i++) tentativa('valida@teste.com', 400);
    assert.doesNotThrow(() => tentativa('valida@teste.com', 401));
  });
});

describe('errorHandler', () => {
  const tratar = (erro) => {
    const res = respostaFalsa();
    errorHandler(erro, {}, res, () => {});
    return res;
  };

  test('AppError usa o status e a mensagem do erro', () => {
    const res = tratar(new AppError('Cupom expirado', 400));
    assert.strictEqual(res.statusCode, 400);
    assert.deepStrictEqual(res.corpo, { erro: 'Cupom expirado' });
  });

  test('erros do SQLite viram respostas amigáveis', () => {
    assert.strictEqual(tratar(Object.assign(new Error('x'), { code: 'SQLITE_CONSTRAINT_UNIQUE' })).statusCode, 409);
    assert.strictEqual(tratar(Object.assign(new Error('x'), { code: 'SQLITE_CONSTRAINT_FOREIGNKEY' })).statusCode, 409);
    assert.strictEqual(tratar(Object.assign(new Error('x'), { code: 'SQLITE_CONSTRAINT_CHECK' })).statusCode, 400);
  });

  test('JSON malformado devolve 400', () => {
    assert.strictEqual(tratar(Object.assign(new Error('x'), { type: 'entity.parse.failed' })).statusCode, 400);
  });

  test('erro inesperado devolve 500 sem expor detalhes', (t) => {
    t.mock.method(console, 'error', () => {});
    const res = tratar(new Error('senha do banco: 123'));
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.corpo, { erro: 'Erro interno do servidor' });
  });
});
