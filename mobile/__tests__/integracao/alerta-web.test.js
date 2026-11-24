import { alertaNoNavegador } from '../../services/alerta-web';

beforeEach(() => {
  window.alert = jest.fn();
  window.confirm = jest.fn();
});

describe('alertas no navegador (web)', () => {
  test('mensagem simples usa window.alert com título e texto', () => {
    alertaNoNavegador('Dados exportados', '140 pedidos no arquivo JSON.');
    expect(window.alert).toHaveBeenCalledWith('Dados exportados\n\n140 pedidos no arquivo JSON.');
  });

  test('confirmação aceita chama o botão de confirmar', () => {
    const remover = jest.fn();
    const cancelar = jest.fn();
    window.confirm.mockReturnValue(true);
    alertaNoNavegador('Carrinho', 'Remover o item?', [
      { text: 'Cancelar', style: 'cancel', onPress: cancelar },
      { text: 'Remover', style: 'destructive', onPress: remover },
    ]);
    expect(remover).toHaveBeenCalledTimes(1);
    expect(cancelar).not.toHaveBeenCalled();
  });

  test('confirmação recusada chama o botão de cancelar', () => {
    const sair = jest.fn();
    window.confirm.mockReturnValue(false);
    alertaNoNavegador('Sair', 'Deseja sair?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', onPress: sair }]);
    expect(sair).not.toHaveBeenCalled();
  });
});
