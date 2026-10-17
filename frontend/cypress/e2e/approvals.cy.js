/**
 * The administrator's pending approvals: shops and couriers in one list, the filter that
 * separates them, a decision taking an application off the list, and the decided list
 * where a wrong decision can be made again.
 *
 * Needs the stack running against a seeded test database with at least one courier and
 * one shop still waiting (see docs/06-TESTING.md).
 */

const signInAsAdmin = () => {
  cy.visit('/login');
  cy.get('fieldset').contains('button', /admin/i).click();
  cy.get('input[type="email"]').clear().type('admin@zamglam.local');
  cy.get('input[type="password"]').clear().type('123456789');
  cy.contains('button[type="submit"]', 'Sign in').click();
  cy.location('pathname', { timeout: 15000 }).should('eq', '/admin/dashboard');
};

const openAttention = () => {
  cy.get('aside').contains('button', 'Attention').click();
  cy.contains('Pending approvals').should('be.visible');
};

const queue = () => cy.contains('h3, h2, p', 'Pending approvals').parents('section, div').first();

describe('Pending approvals', () => {
  beforeEach(() => {
    signInAsAdmin();
    openAttention();
  });

  it('lists courier registrations as well as shop applications', () => {
    cy.contains('li', 'Pending Rider').should('be.visible').within(() => {
      cy.contains('Courier').should('exist');
      cy.contains('Waiting').should('exist');
    });
    cy.contains('li', 'Fresh Threads').should('be.visible').within(() => {
      cy.contains('Shop').should('exist');
    });
  });

  it('the filter isolates couriers from shops', () => {
    cy.get('#approval-filter').select('courier');
    cy.contains('li', 'Pending Rider').should('exist');
    cy.contains('li', 'Fresh Threads').should('not.exist');

    cy.get('#approval-filter').select('shop');
    cy.contains('li', 'Fresh Threads').should('exist');
    cy.contains('li', 'Pending Rider').should('not.exist');
  });

  it('a decision takes the application off the list, and it can be made again', () => {
    // Reject the rider: it leaves the waiting list…
    cy.contains('li', 'Pending Rider').contains('button', 'Reject').click();
    cy.contains('li', 'Pending Rider').should('not.exist');

    // …and appears under the decided applications, carrying its tag.
    cy.contains('button', /decided applications/i).click();
    cy.contains('li', 'Pending Rider').within(() => {
      cy.contains('Rejected').should('exist');
      cy.contains('button', 'Approve').should('not.exist');
      cy.contains('button', /review again/i).click();
    });

    // Reviewing it again lets the decision be reversed.
    cy.contains('li', 'Pending Rider').contains('button', 'Approve').click();
    cy.contains('li', 'Pending Rider').within(() => cy.contains('Approved').should('exist'));
  });

  it('the bottom button opens the marketplace accounts overview', () => {
    cy.contains('button', /marketplace accounts/i).click();
    cy.contains('Subscribers').should('be.visible');
    cy.contains('Accounts, newest first').should('be.visible');
  });
});
