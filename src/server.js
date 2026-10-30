const { validarAmbiente } = require('./config/env');

validarAmbiente();

const os = require('os');
const app = require('./app');

const porta = Number(process.env.PORT) || 3000;

function enderecosDeRede() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((rede) => rede.family === 'IPv4' && !rede.internal)
    .map((rede) => rede.address);
}

app.listen(porta, '0.0.0.0', () => {
  console.log(`API MCCAR rodando em http://localhost:${porta}`);
  for (const ip of enderecosDeRede()) {
    console.log(`Acesso pela rede (Expo): http://${ip}:${porta}`);
  }
});
