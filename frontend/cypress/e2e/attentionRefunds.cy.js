/**
 * Refund cases waiting on the administrator show in Attention, where the header bell
 * sends them, and lead on to Refunds for the decision.
 *
 * The refund list is stubbed, so the spec does not depend on what cases the database has.
 */

const signInAsAdmin = () => {
  cy.visit('/login');
  cy.get('fieldset').contains('button', /admin/i).click();
  cy.get('input[type="email"]').clear().type('admin@zamglam.local');
  cy.get('input[type="password"]').clear().type('123456789');
  cy.contains('button[type="submit"]', 'Sign in').click();
  cy.location('pathname', { timeout: 15000 }).should('eq', '/admin/dashboard');
};

const waiting = {
  id: 901, order_id: 67, shipment_id: 75, status: 'admin_review',
  reason: 'Item damaged or defective', details: 'the zipper isnt working',
  seller_recommendation: 'approve', customer_name: 'John Doe', seller_name: 'Mud',
};
const decided = { ...waiting, id: 902, order_id: 68, status: 'approved' };

describe('Refund cases in Attention', () => {
  it('lists a case waiting on the admin, and opens Refunds to decide it', () => {
    cy.intercept('GET', '**/api/refunds/admin', [waiting, decided]).as('refunds');
    signInAsAdmin();
    cy.get('aside').contains('button', 'Attention').click();

    cy.contains('Refund cases to decide').should('be.visible');
    cy.contains('Order #67 · John Doe vs Mud').should('be.visible');
    cy.contains('shop recommends approving').should('be.visible');
    // Already decided: not waiting on anyone, so not in Attention.
    cy.contains('Order #68').should('not.exist');

    cy.contains('button', 'Decide in Refunds').click();
    cy.get('h1').should('contain', 'Refunds');
    cy.contains('Refund decision queue').should('be.visible');
  });

  it('says so when nothing is waiting', () => {
    cy.intercept('GET', '**/api/refunds/admin', [decided]).as('refunds');
    signInAsAdmin();
    cy.get('aside').contains('button', 'Attention').click();
    cy.contains('No refund case is waiting for a decision.').should('be.visible');
  });
});
