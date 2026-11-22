import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import LoginScreen from '../../screens/login-screen';
import RegisterScreen from '../../screens/register-screen';
import AddressForm from '../../components/address-form';
import Payment from '../../screens/payment-screen';
import * as auth from '../../services/auth';
import * as account from '../../services/account';
import * as cep from '../../services/cep';
import * as shop from '../../services/shop';

jest.mock('../../services/auth');
jest.mock('../../services/account');
jest.mock('../../services/cep');
jest.mock('../../services/shop');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Login', () => {
  test('entra com e-mail e senha', async () => {
    const usuario = { id_usuario: 1, nome: 'Carlos Andrade' };
    auth.login.mockResolvedValue(usuario);
    const onLogin = jest.fn();
    await render(<LoginScreen onLogin={onLogin} onRegister={jest.fn()} />);

    await fireEvent.changeText(screen.getByPlaceholderText('email@dominio.com'), 'carlos@email.com');
    await fireEvent.changeText(screen.getByPlaceholderText('Senha'), '123456');
    await fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(usuario));
    expect(auth.login).toHaveBeenCalledWith('carlos@email.com', '123456');
  });

  test('mostra o erro devolvido pela API', async () => {
    auth.login.mockRejectedValue(new Error('E-mail ou senha inválidos'));
    await render(<LoginScreen onLogin={jest.fn()} onRegister={jest.fn()} />);
    await fireEvent.press(screen.getByText('Continuar'));
    expect(await screen.findByText('E-mail ou senha inválidos')).toBeTruthy();
  });

  test('botão Cadastre-se abre o cadastro', async () => {
    const onRegister = jest.fn();
    await render(<LoginScreen onLogin={jest.fn()} onRegister={onRegister} />);
    await fireEvent.press(screen.getByText('Cadastre-se'));
    expect(onRegister).toHaveBeenCalled();
  });
});

describe('Cadastro', () => {
  test('valida senhas diferentes antes de chamar a API', async () => {
    await render(<RegisterScreen onBack={jest.fn()} onCreated={jest.fn()} />);
    await fireEvent.changeText(screen.getByPlaceholderText('Nome completo'), 'Carlos Andrade');
    await fireEvent.changeText(screen.getByPlaceholderText('email@dominio.com'), 'carlos@email.com');
    await fireEvent.changeText(screen.getByPlaceholderText('Senha'), '123456');
    await fireEvent.changeText(screen.getByPlaceholderText('Confirmar senha'), '654321');
    await fireEvent.press(screen.getByText('Criar conta'));
    expect(await screen.findByText('As senhas não conferem.')).toBeTruthy();
    expect(auth.cadastrar).not.toHaveBeenCalled();
  });

  test('cria a conta e devolve o e-mail para o login', async () => {
    auth.cadastrar.mockResolvedValue({ id_usuario: 2, cupom_boas_vindas: { codigo: 'BEMVINDO50' } });
    const onCreated = jest.fn();
    await render(<RegisterScreen onBack={jest.fn()} onCreated={onCreated} />);
    await fireEvent.changeText(screen.getByPlaceholderText('Nome completo'), 'Ana Lima');
    await fireEvent.changeText(screen.getByPlaceholderText('email@dominio.com'), 'Ana@Email.com');
    await fireEvent.changeText(screen.getByPlaceholderText('Senha'), '123456');
    await fireEvent.changeText(screen.getByPlaceholderText('Confirmar senha'), '123456');
    await fireEvent.press(screen.getByText('Criar conta'));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('ana@email.com', { codigo: 'BEMVINDO50' }));
  });
});

describe('Endereço (CRUD + CEP)', () => {
  test('preenche o endereço pelo CEP e cadastra', async () => {
    cep.buscarCep.mockResolvedValue({ logradouro: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' });
    account.criarEndereco.mockResolvedValue({ id_endereco: 10 });
    const onSaved = jest.fn();
    await render(<AddressForm principal onSaved={onSaved} />);

    await fireEvent.changeText(screen.getByLabelText('CEP'), '01001000');
    expect(await screen.findByDisplayValue('Praça da Sé')).toBeTruthy();
    expect(screen.getByDisplayValue('São Paulo')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Número'), '100');
    await fireEvent.press(screen.getByText('Salvar endereço'));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ id_endereco: 10 }));
    expect(account.criarEndereco).toHaveBeenCalledWith(
      expect.objectContaining({ cep: '01001000', logradouro: 'Praça da Sé', numero: '100', uf: 'SP', principal: 1 })
    );
  });

  test('edita um endereço existente', async () => {
    const endereco = {
      id_endereco: 3,
      cep: '09010000',
      logradouro: 'Rua das Oficinas',
      numero: '120',
      complemento: '',
      bairro: 'Centro',
      cidade: 'Santo André',
      uf: 'SP',
      principal: 1,
    };
    account.atualizarEndereco.mockResolvedValue({ ...endereco, numero: '200' });
    const onSaved = jest.fn();
    await render(<AddressForm endereco={endereco} onSaved={onSaved} />);

    await fireEvent.changeText(screen.getByDisplayValue('120'), '200');
    await fireEvent.press(screen.getByText('Salvar alterações'));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(account.atualizarEndereco).toHaveBeenCalledWith(3, expect.objectContaining({ numero: '200', cep: '09010000' }));
    expect(cep.buscarCep).not.toHaveBeenCalled();
  });
});

describe('Pagamento com Mercado Pago', () => {
  const pedido = { id_pedido: 42, numero: 'MC-42', subtotal_centavos: 18990, desconto_centavos: 0, frete_centavos: 2490, total_centavos: 21480 };

  beforeEach(() => {
    account.listarCartoes.mockResolvedValue([]);
  });

  test('abre o checkout do Mercado Pago e vai para a confirmação quando aprovado', async () => {
    shop.iniciarMercadoPago.mockResolvedValue({ checkout_url: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1' });
    shop.sincronizarMercadoPago.mockResolvedValue({ status_pedido: 'PAGO', pagamento: { status: 'APROVADO', metodo: 'PIX' } });
    const go = jest.fn();
    await render(<Payment go={go} back={jest.fn()} order={pedido} />);

    await fireEvent.press(screen.getByText('Pagar com Mercado Pago'));

    await waitFor(() => expect(go).toHaveBeenCalledWith('confirmation', { orderId: 42 }, { replace: true }));
    expect(shop.iniciarMercadoPago).toHaveBeenCalledWith(42);
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1', expect.any(Object));
  });

  test('se o cliente fechar sem pagar, permite verificar de novo', async () => {
    shop.iniciarMercadoPago.mockResolvedValue({ checkout_url: 'https://mp/1' });
    shop.sincronizarMercadoPago.mockResolvedValue({
      status_pedido: 'AGUARDANDO_PAGAMENTO',
      pagamento: { status: 'PENDENTE', metodo: 'MERCADO_PAGO' },
    });
    const go = jest.fn();
    await render(<Payment go={go} back={jest.fn()} order={pedido} />);

    await fireEvent.press(screen.getByText('Pagar com Mercado Pago'));

    expect(await screen.findByText('Já paguei, verificar')).toBeTruthy();
    expect(go).not.toHaveBeenCalled();
  });

  test('pagamento no app (demonstração) com Pix', async () => {
    shop.pagar.mockResolvedValue({ status: 'APROVADO' });
    const go = jest.fn();
    await render(<Payment go={go} back={jest.fn()} order={pedido} />);

    await fireEvent.press(screen.getByText('Pagar no app'));
    await fireEvent.press(screen.getByText('Pix'));
    await fireEvent.press(screen.getByText('Confirmar pagamento'));

    await waitFor(() => expect(go).toHaveBeenCalledWith('confirmation', { orderId: 42 }, { replace: true }));
    expect(shop.pagar).toHaveBeenCalledWith({ id_pedido: 42, metodo: 'PIX' });
  });
});
