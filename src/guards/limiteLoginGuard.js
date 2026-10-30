const AppError = require('../utils/AppError');

const LIMITE_FALHAS = 5;
const JANELA_MS = 15 * 60 * 1000;

const tentativas = new Map();

setInterval(() => {
  const agora = Date.now();
  for (const [chave, registro] of tentativas) {
    if (registro.expiraEm <= agora) tentativas.delete(chave);
  }
}, JANELA_MS).unref();

function chaveDaTentativa(req) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  return `${req.ip}:${email}`;
}

function registrarResultado(chave, statusCode) {
  if (statusCode === 200) {
    tentativas.delete(chave);
    return;
  }
  if (statusCode !== 401) return;

  const agora = Date.now();
  const atual = tentativas.get(chave);
  const falhas = (atual && atual.expiraEm > agora ? atual.falhas : 0) + 1;

  tentativas.set(chave, {
    falhas,
    expiraEm: agora + JANELA_MS,
    bloqueadoAte: falhas >= LIMITE_FALHAS ? agora + JANELA_MS : 0,
  });
}

function limiteLoginGuard(req, res, next) {
  const chave = chaveDaTentativa(req);
  const registro = tentativas.get(chave);
  const agora = Date.now();

  if (registro && registro.bloqueadoAte > agora) {
    const segundos = Math.ceil((registro.bloqueadoAte - agora) / 1000);
    res.set('Retry-After', String(segundos));
    throw new AppError(`Muitas tentativas de login. Tente novamente em ${Math.ceil(segundos / 60)} minuto(s)`, 429);
  }

  res.on('finish', () => registrarResultado(chave, res.statusCode));
  next();
}

module.exports = limiteLoginGuard;
