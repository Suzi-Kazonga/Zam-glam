/**
 * The shopper's bell, live: an order is placed, the shopper looks once (history, not
 * news), the shop packs the parcel, and the bell counts it.
 */

const PASSWORD = '123456789';

const apiLogin = (email, role) => cy.request('POST', '/api/auth/login', { email, password: PASSWORD, role }).its('body.token');

describe('The shopper is told when a parcel moves', () => {
  let orderId;
  let parcelId;

  before(() => {
    apiLogin('customer@zamglam.local', 'customer').then((token) => {
      cy.request('/api/products').then(({ body: products }) => {
        const mud = products.find((p) => (p.store_name || '').toLowerCase() === 'mud' && p.stock > 0);
        cy.request({
          method: 'POST',
          url: '/api/orders',
          headers: { Authorization: `Bearer ${token}` },
          body: { items: [{ product_id: mud.id, quantity: 1 }], address: 'Kabulonga', location: 'Lusaka', phone: '+260 97 000 0001', paymentMethod: 'cash' },
        }).then(({ body }) => {
          orderId = body.id;
          // The parcel belongs to the order; read it back to learn its id.
          cy.request({ url: `/api/orders/${orderId}`, headers: { Authorization: `Bearer ${token}` } })
            .then(({ body: placed }) => { parcelId = (placed.shipments || [])[0]?.id; });
        });
      });
    });
  });

  it('counts the change, chimes for it, and clears once seen', () => {
    // Sign in through the page: the bell takes its first look and remembers everything.
    cy.visit('/login');
    cy.get('fieldset').contains('button', /customer/i).click();
    cy.get('input[type="email"]').type('customer@zamglam.local');
    cy.get('input[type="password"]').type(PASSWORD);
    cy.contains('button[type="submit"]', 'Sign in').click();
    cy.location('pathname', { timeout: 15000 }).should('not.eq', '/login');
    cy.get('button[aria-label="Order updates"]', { timeout: 10000 }).should('exist');

    // The shop starts packing.
    apiLogin('mud@zamglam.local', 'seller').then((token) => {
      cy.request({
        method: 'PATCH',
        url: `/api/orders/shipments/${parcelId}/status`,
        headers: { Authorization: `Bearer ${token}` },
        body: { status: 'processing' },
      });
    });

    // The bell checks every fifteen seconds.
    cy.get('button[aria-label="1 order update"]', { timeout: 25000 }).click();
    cy.contains(`Order #${orderId}`).should('be.visible');
    cy.contains('Shop is packing').should('be.visible');
    cy.get('button[aria-label="Order updates"]').should('exist');
  });
});
