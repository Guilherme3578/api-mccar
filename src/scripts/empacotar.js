const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..', '..');
const nomeDoArquivo = 'MCCAR-projeto.zip';
const destino = path.join(raiz, nomeDoArquivo);

function git(...args) {
  return execFileSync('git', args, { cwd: raiz, encoding: 'utf8' }).trim();
}

const pendentes = git('status', '--porcelain');
if (pendentes) {
  console.warn('Atenção: há alterações que ainda não foram commitadas. O zip leva só o que está no último commit:');
  console.warn(pendentes.split('\n').map((linha) => `  ${linha}`).join('\n'));
}

git('archive', '--format=zip', '--prefix=MCCAR/', '-o', destino, 'HEAD');

const commit = git('log', '-1', '--format=%h %s');
const tamanhoKb = Math.round(fs.statSync(destino).size / 1024);
console.log(`${nomeDoArquivo} criado (${tamanhoKb} KB) a partir do commit ${commit}`);
console.log('Ficam de fora: .env, banco de dados (data/), node_modules e tudo que está no .gitignore');
