/**
 * End-to-end browser tests: the journeys a shopper takes, clicked through in a real browser
 * against the real frontend and backend.
 *
 * Kept from the first version of this file: its four journeys — signing in, browsing,
 * the basket and checkout, and tracking. Rewritten so every step uses what is actually on
 * the page. The chat and notification-toast tests were dropped: Zamglam has no chat.
 *
 * They need the whole stack running with seeded data (see docs/06-TESTING.md). They place
 * a real order and register a real account, so point them at a test database, never at
 * data you care about.
 */

const customer = { email: 'customer@zamglam.local', password: 'CUSTOMER123456' };

// Sign in through the form, as a person would.
const signIn = ({ email, password }) => {
  cy.visit('/login');
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  cy.contains('button[type="submit"]', 'Sign in').click();
};

describe('Signing in', () => {
  it('shows the sign-in form', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.contains('button[type="submit"]', 'Sign in as customer').should('be.visible');
  });

  it('signs a seeded customer in and leaves the login page', () => {
    signIn(customer);
    cy.location('pathname').should('not.eq', '/login');
    cy.window().then((win) => expect(win.localStorage.getItem('token')).to.be.a('string'));
  });

  it('refuses a wrong password and stays on the form', () => {
    signIn({ email: customer.email, password: 'not-the-password' });
    cy.location('pathname').should('eq', '/login');
    cy.window().then((win) => expect(win.localStorage.getItem('token')).to.eq(null));
  });
});

describe('Signing up', () => {
  it('will not create an account until the terms are agreed to', () => {
    cy.visit('/signup/customer');
    cy.get('input[aria-label="Name"]').type('Browser Tester');
    cy.get('input[aria-label="Email"]').type(`browser${Date.now()}@example.com`);
    cy.get('input[aria-label="Password"]').type('Browser123456');
    cy.get('input[aria-label="Confirm password"]').type('Browser123456');
    cy.contains('button', 'Sign Up').click();
    cy.contains('You must agree to the terms and conditions').should('be.visible');
    cy.location('pathname').should('eq', '/signup/customer');

    cy.get('input[type="checkbox"]').check();
    cy.contains('button', 'Sign Up').click();
    cy.location('pathname').should('eq', '/login');
  });
});

describe('Browsing', () => {
  it('lists real products from the catalogue', () => {
    cy.visit('/products');
    cy.get('article').should('have.length.greaterThan', 0);
    cy.contains('article', 'in stock').should('exist');
  });

  it('finds products by search', () => {
    cy.visit('/');
    cy.get('input[placeholder="Search all styles"]').first().type('Denim{enter}');
    cy.location('search').should('include', 'search=Denim');
    cy.contains('article', /denim/i).should('exist');
  });

  it('opens a product with its price and stock', () => {
    cy.visit('/products');
    cy.get('article a[href^="/product/"]').first().click();
    cy.get('h1').should('be.visible');
    cy.contains(/in stock|Sold out/).should('be.visible');
  });
});

describe('Basket, checkout and tracking', () => {
  beforeEach(() => {
    signIn(customer);
    cy.location('pathname').should('not.eq', '/login');
  });

  it('adds a product, checks out, and tracks the order', () => {
    cy.visit('/products');
    cy.contains('article', 'in stock').within(() => {
      cy.contains('button', 'Add to cart').click();
      cy.contains('button', 'Added to cart').should('exist');
    });

    cy.visit('/cart');
    cy.contains('h1', 'Shopping bag').should('be.visible');
    cy.get('input[aria-label="Quantity"]').should('have.length.greaterThan', 0);
    cy.contains('button', 'Continue to checkout').click();

    cy.contains('h1', 'Delivery and payment').should('be.visible');
    cy.get('input[placeholder="House number, street, city"]').clear().type('Plot 12, Kabulonga Road, Lusaka');
    cy.get('input[placeholder="e.g., Lusaka, Kitwe, Ndola"]').clear().type('Lusaka');
    cy.get('input[placeholder="+260 ..."]').clear().type('+260 97 000 0001');
    cy.get('input[type="radio"][name="payment"]').first().check();
    cy.contains('button', 'Place order').click();

    cy.contains('h1', 'Your order is on its way', { timeout: 15000 }).should('be.visible');
    cy.contains('a', 'Track order').click();
    cy.location('pathname').should('match', /^\/orders\/\d+$/);
    cy.contains('h1', /^Order #\d+$/).should('be.visible');
  });
});
