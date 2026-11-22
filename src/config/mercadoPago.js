function semBarraNoFinal(url) {
  return (url || '').trim().replace(/\/+$/, '');
}

module.exports = Object.freeze({
  accessToken: (process.env.MP_ACCESS_TOKEN || '').trim(),
  urlPublica: semBarraNoFinal(process.env.MP_URL_PUBLICA),
  segredoWebhook: (process.env.MP_WEBHOOK_SECRET || '').trim(),
  urlRetorno: semBarraNoFinal(process.env.MP_URL_RETORNO),
  nomeNaFatura: 'MCCAR',
});
