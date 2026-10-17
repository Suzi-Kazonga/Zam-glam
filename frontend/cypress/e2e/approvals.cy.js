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


// Fresh applications every run, so the spec can be run again and again: deciding one
// uses it up.
const stamp = Date.now();
const rider = `Rider ${stamp}`;
const shop = `Threads ${stamp}`;

const register = (body) => cy.request('POST', '/api/auth/register', { password: '123456789', accepted_terms: true, ...body });

describe('Pending approvals', () => {
  before(() => {
    register({ name: rider, email: `rider${stamp}@zamglamcourier.local`, role: 'courier', phone: '+260 97 555 0001' });
    register({ name: 'New Owner', email: `shop${stamp}@zamglam.local`, role: 'seller', shop_name: shop });
  });

  beforeEach(() => {
    signInAsAdmin();
    openAttention();
  });

  it('lists courier registrations as well as shop applications', () => {
    cy.contains('li', rider).should('be.visible').within(() => {
      cy.contains('Courier').should('exist');
      cy.contains('Waiting').should('exist');
    });
    cy.contains('li', shop).should('be.visible').within(() => {
      cy.contains('Shop').should('exist');
    });
  });

  it('the filter isolates couriers from shops', () => {
    cy.get('#approval-filter').select('courier');
    cy.contains('li', rider).should('exist');
    cy.contains('li', shop).should('not.exist');

    cy.get('#approval-filter').select('shop');
    cy.contains('li', shop).should('exist');
    cy.contains('li', rider).should('not.exist');
  });

  it('a decision takes the application off the list, and it can be made again', () => {
    // Reject the rider: it leaves the waiting list…
    cy.contains('li', rider).contains('button', 'Reject').click();
    cy.contains('li', rider).should('not.exist');

    // …and appears under the decided applications, carrying its tag.
    cy.contains('button', /decided applications/i).click();
    cy.contains('li', rider).within(() => {
      cy.contains('Rejected').should('exist');
      cy.contains('button', 'Approve').should('not.exist');
      cy.contains('button', /review again/i).click();
    });

    // Reviewing it again lets the decision be reversed.
    cy.contains('li', rider).contains('button', 'Approve').click();
    cy.contains('li', rider).within(() => cy.contains('Approved').should('exist'));
  });

  it('the bottom button opens the marketplace accounts overview', () => {
    cy.contains('button', /marketplace accounts/i).click();
    cy.contains('Subscribers').should('be.visible');
    cy.contains('Accounts, newest first').should('be.visible');
  });
});

// The same rule in the Verification section and the couriers' account list: once
// decided, Approve and Reject give way to a single Review button.
describe('Review replaces Approve and Reject once an account is decided', () => {
  const reviewRider = `Review rider ${stamp}`;

  before(() => {
    register({ name: reviewRider, email: `review${stamp}@zamglamcourier.local`, role: 'courier', phone: '+260 97 555 0002' });
  });

  it('in the couriers list', () => {
    signInAsAdmin();
    cy.visit('/admin/users/couriers');

    // Still waiting: both decisions are offered.
    cy.contains('tr', reviewRider).within(() => {
      cy.contains('button', 'Approve').should('exist');
      cy.contains('button', 'Reject').click();
    });

    // Decided: only Review, until it is pressed.
    cy.contains('tr', reviewRider).within(() => {
      cy.contains('button', 'Approve').should('not.exist');
      cy.contains('button', 'Reject').should('not.exist');
      cy.contains('button', 'Review').click();
      cy.contains('button', 'Approve').click();
    });

    cy.contains('tr', reviewRider).within(() => {
      cy.contains('button', 'Review').should('exist');
      cy.contains('button', 'Approve').should('not.exist');
    });
  });

  it('in the shop verification section', () => {
    signInAsAdmin();
    cy.get('aside').contains('button', 'Verification').click();
    // Jets was verified by the seed: decided, so Review only.
    cy.contains('article', 'Jets').within(() => {
      cy.contains('button', 'Approve').should('not.exist');
      cy.contains('button', 'Reject').should('not.exist');
      cy.contains('button', 'Review').click();
      cy.contains('button', 'Reject').should('exist');
      cy.contains('button', 'Cancel').click();
      cy.contains('button', 'Review').should('exist');
    });
  });
});
