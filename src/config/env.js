require('dotenv').config({ quiet: true });

const TAMANHO_MINIMO_SEGREDO = 32;

function validarAmbiente() {
  const erros = [];

  if (!process.env.JWT_SECRET) {
    erros.push('JWT_SECRET não configurado');
  } else if (process.env.JWT_SECRET.length < TAMANHO_MINIMO_SEGREDO) {
    erros.push(`JWT_SECRET deve ter pelo menos ${TAMANHO_MINIMO_SEGREDO} caracteres`);
  }

  if (process.env.PORT && !Number.isInteger(Number(process.env.PORT))) {
    erros.push('PORT deve ser um número');
  }

  for (const nome of ['FRETE_PADRAO_CENTAVOS', 'FRETE_TRANSPORTE_MIN_DIAS', 'FRETE_TRANSPORTE_MAX_DIAS']) {
    const valor = process.env[nome];
    if (valor && (!Number.isInteger(Number(valor)) || Number(valor) < 0)) {
      erros.push(`${nome} deve ser um número inteiro maior ou igual a 0`);
    }
  }

  const minimo = Number(process.env.FRETE_TRANSPORTE_MIN_DIAS || 2);
  const maximo = Number(process.env.FRETE_TRANSPORTE_MAX_DIAS || 7);
  if (minimo > maximo) {
    erros.push('FRETE_TRANSPORTE_MIN_DIAS não pode ser maior que FRETE_TRANSPORTE_MAX_DIAS');
  }

  if (erros.length > 0) {
    console.error('Configuração inválida no .env:');
    for (const erro of erros) console.error(`  - ${erro}`);
    console.error('Copie o .env.example para .env e preencha os valores.');
    process.exit(1);
  }
}

module.exports = { validarAmbiente };
