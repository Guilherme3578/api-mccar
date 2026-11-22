const relatorioService = require('../services/relatorioService');
const { paraFlag } = require('../utils/validacao');

function dados(req, res) {
  const relatorio = relatorioService.dados();
  if (paraFlag(req.query.download)) {
    res.attachment(relatorioService.nomeDoArquivo(relatorio.gerado_em));
  }
  res.json(relatorio);
}

module.exports = { dados };
