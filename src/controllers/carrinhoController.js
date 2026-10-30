const carrinhoService = require('../services/carrinhoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(carrinhoService.listar(req.usuario, req.query));
}

function buscarPorId(req, res) {
  res.json(carrinhoService.detalhar(req.usuario, paraId(req.params.id)));
}

function meu(req, res) {
  res.json(carrinhoService.meu(req.usuario));
}

function criar(req, res) {
  res.status(201).json(carrinhoService.criar(req.usuario));
}

function remover(req, res) {
  carrinhoService.remover(req.usuario, paraId(req.params.id));
  res.status(204).send();
}

module.exports = { listar, buscarPorId, meu, criar, remover };
