export function brl(centavos) {
  const valor = Number(centavos || 0) / 100;
  const partes = valor.toFixed(2).split('.');
  const inteiro = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return 'R$ ' + inteiro + ',' + partes[1];
}

export function dataBr(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return dia + '/' + mes + '/' + d.getFullYear();
}

export function enderecoTexto(e) {
  if (!e) return '';
  const rua = e.logradouro || e.entrega_logradouro;
  const num = e.numero || e.entrega_numero;
  const cidade = e.cidade || e.entrega_cidade;
  const uf = e.uf || e.entrega_uf;
  return rua + ', ' + num + ' · ' + cidade + ', ' + uf;
}

export function prazoTexto(min, max) {
  if (!min && !max) return '';
  if (min === max) return min + ' dias úteis';
  return min + ' a ' + max + ' dias úteis';
}

export function bandeiraPorNumero(numero) {
  const n = String(numero).replace(/\D/g, '');
  if (/^4/.test(n)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'MASTERCARD';
  if (/^3[47]/.test(n)) return 'AMEX';
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(n)) return 'ELO';
  if (/^(606282|3841)/.test(n)) return 'HIPERCARD';
  return 'CARTAO';
}

export function mascaraCartao(texto) {
  const n = String(texto).replace(/\D/g, '').slice(0, 16);
  return n.replace(/(.{4})/g, '$1 ').trim();
}

export function mascaraValidade(texto) {
  const n = String(texto).replace(/\D/g, '').slice(0, 4);
  if (n.length <= 2) return n;
  return n.slice(0, 2) + '/' + n.slice(2);
}

export function mascaraCep(texto) {
  const n = String(texto).replace(/\D/g, '').slice(0, 8);
  if (n.length <= 5) return n;
  return n.slice(0, 5) + '-' + n.slice(5);
}

export function validadeOk(texto) {
  const m = /^(\d{2})\/(\d{2})$/.exec(texto);
  if (!m) return false;
  const mes = Number(m[1]);
  const ano = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  const hoje = new Date();
  return ano > hoje.getFullYear() || (ano === hoje.getFullYear() && mes >= hoje.getMonth() + 1);
}
