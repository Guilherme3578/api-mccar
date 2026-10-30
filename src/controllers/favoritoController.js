const favoritoService = require('../services/favoritoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(favoritoService.listar(req.usuario, paraId(req.params.idUsuario, 'idUsuario')));
}

function adicionar(req, res) {
  res.status(201).json(favoritoService.adicionar(req.usuario, paraId(req.params.idUsuario, 'idUsuario'), req.body));
}

function remover(req, res) {
  favoritoService.remover(
    req.usuario,
    paraId(req.params.idUsuario, 'idUsuario'),
    paraId(req.params.idProduto, 'idProduto')
  );
  res.status(204).send();
}

module.exports = { listar, adicionar, remover };
