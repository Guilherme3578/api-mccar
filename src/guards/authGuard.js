const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');
const AppError = require('../utils/AppError');

function authGuard(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    throw new AppError('Token de acesso não informado', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new AppError('Token inválido ou expirado', 401);
  }

  const usuario = usuarioRepository.buscarPorId(payload.id_usuario);
  if (!usuario) {
    throw new AppError('Usuário do token não existe mais', 401);
  }

  req.usuario = usuario;
  next();
}

module.exports = authGuard;
