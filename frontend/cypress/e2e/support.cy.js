/**
 * Reporting a problem, from the person who hits it to the administrator who clears it.
 *
 * Needs the stack running against a seeded test database (see docs/06-TESTING.md); it
 * writes real reports.
 */

const PASSWORD = '123456789';

const signIn = (email, role) => {
  cy.visit('/login');
  cy.get('fieldset').contains('button', new RegExp(role, 'i')).click();
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(PASSWORD);
  cy.contains('button[type="submit"]', 'Sign in').click();
  cy.location('pathname', { timeout: 15000 }).should('not.eq', '/login');
};

const reportFromProfile = (text) => {
  cy.visit('/account');
  cy.contains('button', 'Report a problem').click();
  cy.get('textarea').type(text);
  cy.contains('button', 'Send to the administrators').click();
  cy.contains(/an administrator will see this/i, { timeout: 10000 }).should('be.visible');
  cy.contains('button', 'Done').click();
};

describe('Reporting a problem', () => {
  const stamp = Date.now();
  const fromCustomer = `Customer report ${stamp}`;
  const fromCourier = `Courier report ${stamp}`;

  it('a shopper can report one from their profile', () => {
    signIn('customer@zamglam.local', 'customer');
    reportFromProfile(fromCustomer);
  });

  it('a courier can report one too, and has the button in their menu', () => {
    signIn('mwansa@zamglamcourier.local', 'courier');
    cy.get('aside').contains('button', 'Report a problem').should('exist');
    reportFromProfile(fromCourier);
  });

  it('a shop has the button in its menu', () => {
    signIn('mud@zamglam.local', 'seller');
    cy.get('[aria-label="Open seller navigation"]').click();
    cy.get('nav[aria-label="Seller dashboard navigation"]').contains('button', 'Report a problem').should('exist');
  });

  it('the administrator sees both, with the role of whoever reported them', () => {
    signIn('admin@zamglam.local', 'admin');
    cy.visit('/account');

    // Never offered to an administrator: these come to them.
    cy.contains('button', 'Report a problem').should('not.exist');

    // The count sits on the button until the queue is cleared.
    cy.contains('button', 'Customer Service').click();
    cy.contains(fromCustomer, { timeout: 10000 }).should('be.visible');
    cy.contains(fromCourier).should('be.visible');
    cy.contains('customer').should('be.visible');
    cy.contains('courier').should('be.visible');
  });

  it('marking one done takes it off the queue and drops the count', () => {
    signIn('admin@zamglam.local', 'admin');
    cy.visit('/account');

    cy.contains('button', 'Customer Service').click();
    cy.contains(/\d+ problems? waiting/i, { timeout: 10000 }).invoke('text').then((before) => {
      const waiting = Number(before.match(/\d+/)[0]);

      cy.contains('li', fromCustomer).contains('button', 'Mark done').click();

      cy.contains('li', fromCustomer).should('not.exist');
      cy.contains(`${waiting - 1} problem`, { timeout: 10000 }).should('be.visible');
    });
  });
});
