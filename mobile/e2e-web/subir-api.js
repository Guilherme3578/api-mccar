const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..', '..');
process.chdir(raiz);

for (const sufixo of ['', '-wal', '-shm']) {
  fs.rmSync(process.env.DB_PATH + sufixo, { force: true });
}

require(path.join(raiz, 'src', 'scripts', 'seed'));
require(path.join(raiz, 'src', 'server'));
