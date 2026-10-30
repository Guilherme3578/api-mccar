require('../config/env');

const usuarioRepository = require('../repositories/usuarioRepository');
const Perfil = require('../enums/Perfil');

const email = String(process.argv[2] ?? '').trim().toLowerCase();

if (!email) {
  console.error('Uso: npm run admin -- email@exemplo.com');
  process.exit(1);
}

const usuario = usuarioRepository.buscarPorEmail(email);

if (!usuario) {
  console.error(`Nenhum usuário encontrado com o e-mail ${email}`);
  process.exit(1);
}

usuarioRepository.atualizarPerfil(usuario.id_usuario, Perfil.ADMIN);
console.log(`${usuario.nome} (${usuario.email}) agora é ${Perfil.ADMIN}`);
