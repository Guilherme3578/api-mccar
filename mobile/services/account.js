import { api } from './api';

export const listarEnderecos = () => api.get('/enderecos');
export const criarEndereco = (dados) => api.post('/enderecos', dados);
export const removerEndereco = (id) => api.del('/enderecos/' + id);

export const listarCartoes = () => api.get('/cartoes');
export const removerCartao = (id) => api.del('/cartoes/' + id);

export const listarVeiculos = () => api.get('/veiculos');
export const criarVeiculo = (idModelo, principal) =>
  api.post('/veiculos', { id_modelo_veiculo: idModelo, principal: principal ? 1 : 0 });
export const removerVeiculo = (id) => api.del('/veiculos/' + id);
export const tornarVeiculoPrincipal = (id) => api.put('/veiculos/' + id, { principal: 1 });

export const listarFavoritos = (idUsuario) => api.get('/usuarios/' + idUsuario + '/favoritos');
export const favoritar = (idUsuario, idProduto) =>
  api.post('/usuarios/' + idUsuario + '/favoritos', { id_produto: idProduto });
export const desfavoritar = (idUsuario, idProduto) =>
  api.del('/usuarios/' + idUsuario + '/favoritos/' + idProduto);
