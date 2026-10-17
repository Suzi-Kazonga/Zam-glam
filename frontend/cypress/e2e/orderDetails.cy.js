/**
 * The Details button on a shop's order: the customer it is for, and the courier carrying
 * it. Places its own order first, so it can be run again.
 */

const PASSWORD = '123456789';
const address = `Plot ${Date.now() % 10000}, Kabulonga Road`;

const signIn = (email, role) => {
  cy.visit('/login');
  cy.get('fieldset').contains('button', new RegExp(role, 'i')).click();
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(PASSWORD);
  cy.contains('button[type="submit"]', 'Sign in').click();
  cy.location('pathname', { timeout: 15000 }).should('not.eq', '/login');
};

describe('Order details for the shop', () => {
  let orderId;

  before(() => {
    // A real order from the seeded shopper, for one of Mud's products.
    cy.request('POST', '/api/auth/login', { email: 'customer@zamglam.local', password: PASSWORD, role: 'customer' })
      .then(({ body }) => {
        const token = body.token;
        cy.request('/api/products').then(({ body: products }) => {
          const mud = products.find((p) => (p.store_name || '').toLowerCase() === 'mud' && p.stock > 0);
          cy.request({
            method: 'POST',
            url: '/api/orders',
            headers: { Authorization: `Bearer ${token}` },
            body: { items: [{ product_id: mud.id, quantity: 1 }], address, location: 'Lusaka', phone: '+260 97 000 0001', paymentMethod: 'cash' },
          }).then(({ body: order }) => { orderId = order.id; });
        });
      });
  });

  it('shows the customer, and says when there is no courier yet', () => {
    signIn('mud@zamglam.local', 'seller');
    cy.get('[aria-label="Open seller navigation"]').click();
    cy.get('nav[aria-label="Seller dashboard navigation"]').contains('button', 'Orders').click();

    cy.contains('article', `Order #${orderId}`).contains('button', 'Details').click();

    cy.get('[role="dialog"]').within(() => {
      cy.contains(`Order #${orderId}`).should('exist');
      cy.contains('John Doe').should('be.visible');
      cy.contains(address).should('be.visible');
      cy.contains('+260 97 000 0001').should('be.visible');
      cy.contains('No courier yet').should('be.visible');
      cy.get('[aria-label="Close"]').click();
    });
    cy.get('[role="dialog"]').should('not.exist');
  });
});
