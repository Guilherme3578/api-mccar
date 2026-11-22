const TELAS = [
  'login-screen',
  'register-screen',
  'home-screen',
  'catalog-screen',
  'detail-screen',
  'cart-screen',
  'checkout-screen',
  'payment-screen',
  'confirmation-screen',
  'profile-screen',
  'admin-products-screen',
  'admin-product-form-screen',
  'contact-screen',
];

describe('todas as telas carregam sem erro de sintaxe ou import', () => {
  test.each(TELAS)('%s', (nome) => {
    const modulo = require('../../screens/' + nome);
    expect(typeof modulo.default).toBe('function');
  });

  test('App', () => {
    expect(typeof require('../../App').default).toBe('function');
  });
});
