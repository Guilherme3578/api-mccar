const AppError = require('../utils/AppError');
const { ehAdmin } = require('../utils/acesso');

function adminGuard(req, res, next) {
  if (!req.usuario || !ehAdmin(req.usuario)) {
    throw new AppError('Acesso restrito a administradores', 403);
  }
  next();
}

module.exports = adminGuard;
