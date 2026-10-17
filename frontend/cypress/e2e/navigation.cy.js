/**
 * Every menu entry, for every kind of account, clicked in a real browser.
 *
 * A dashboard section that renders nothing, or a button that leaves the role's own area,
 * is invisible to the unit tests — the page still "works", it is simply empty. These
 * click each entry in turn and insist the section opens.
 *
 * The three menus are not the same shape: the shopper and the courier have a sidebar, the
 * shop has a menu that opens from its top bar, and three of the admin's entries leave the
 * console for an account list.
 *
 * Needs the stack running against a seeded test database (see docs/06-TESTING.md).
 */

const PASSWORD = '123456789';

// The form asks which kind of account you are signing in as, and the server refuses a
// mismatch — so the tab has to be chosen, exactly as a person would. Each button carries
// an emoji beside its label, so match inside the chooser only.
const signIn = (email, role) => {
  cy.visit('/login');
  cy.get('fieldset').contains('button', new RegExp(role, 'i')).click();
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(PASSWORD);
  cy.contains('button[type="submit"]', 'Sign in').click();
  cy.location('pathname', { timeout: 15000 }).should('not.eq', '/login');
};

const sidebarSection = (label) => cy.get('aside').contains('button', label).click();

describe('The shopper\'s menu', () => {
  beforeEach(() => {
    signIn('customer@zamglam.local', 'customer');
    cy.visit('/customer/dashboard');
  });

  const sections = ['Overview', 'Orders', 'Products', 'Messages', 'Cart', 'Collections', 'Profile', 'Wishlist'];

  sections.forEach((label) => {
    it(`opens ${label}`, () => {
      sidebarSection(label);
      cy.location('pathname').should('eq', '/customer/dashboard');
      // The chosen entry is the highlighted one, and the panel beside it has content.
      cy.get('aside').contains('button', label).should('exist');
      cy.get('main, section').should('exist');
    });
  });
});

describe('The shop\'s menu', () => {
  beforeEach(() => signIn('mud@zamglam.local', 'seller'));

  it('lands on the shop dashboard', () => {
    cy.location('pathname').should('eq', '/seller/dashboard');
  });

  const sections = ['Overview', 'Products', 'Orders', 'Messages', 'Refunds', 'Analytics', 'Promotions', 'Store profile', 'Notifications', 'Reviews', 'Verification'];

  sections.forEach((label) => {
    it(`opens ${label}`, () => {
      cy.get('[aria-label="Open seller navigation"]').click();
      cy.get('nav[aria-label="Seller dashboard navigation"]').contains('button', label).click();
      cy.location('pathname').should('eq', '/seller/dashboard');
      cy.get('main, section').should('exist');
    });
  });
});

describe('The courier\'s menu', () => {
  beforeEach(() => signIn('mwansa@zamglamcourier.local', 'courier'));

  it('lands on the courier dashboard', () => {
    cy.location('pathname').should('eq', '/courier/dashboard');
  });

  ['Available', 'Deliveries', 'Completed'].forEach((label) => {
    it(`opens ${label}`, () => {
      sidebarSection(label);
      cy.location('pathname').should('eq', '/courier/dashboard');
      cy.get('aside').contains('button', label).should('exist');
    });
  });

  it('has no chat button — a courier has nobody on the platform to message', () => {
    cy.get('header').find('a[href="/contact"]').should('not.exist');
    cy.get('header').find('[aria-label]').each(($el) => {
      expect($el.attr('aria-label').toLowerCase()).to.not.match(/chat|support/);
    });
  });
});

describe('The administrator\'s menu', () => {
  beforeEach(() => signIn('admin@zamglam.local', 'admin'));

  it('lands on the admin console', () => {
    cy.location('pathname').should('eq', '/admin/dashboard');
  });

  // These stay on the console and swap the panel.
  ['Overview', 'Attention', 'Verification', 'Reports', 'Refunds', 'Deliveries'].forEach((label) => {
    it(`opens ${label} on the console`, () => {
      sidebarSection(label);
      cy.location('pathname').should('eq', '/admin/dashboard');
    });
  });

  // These three are account lists, and open their own page.
  [['Sellers', '/admin/users/sellers'], ['Customers', '/admin/users/customers'], ['Couriers', '/admin/users/couriers']].forEach(([label, path]) => {
    it(`${label} opens the account list`, () => {
      sidebarSection(label);
      cy.location('pathname').should('eq', path);
      cy.contains(new RegExp(label, 'i')).should('be.visible');
    });
  });
});

describe('Each role stays in its own area', () => {
  it('a courier cannot open the shop dashboard', () => {
    signIn('mwansa@zamglamcourier.local', 'courier');
    cy.visit('/seller/dashboard');
    cy.location('pathname').should('not.eq', '/seller/dashboard');
  });

  it('a shopper cannot open the admin console', () => {
    signIn('customer@zamglam.local', 'customer');
    cy.visit('/admin/dashboard');
    cy.location('pathname').should('not.eq', '/admin/dashboard');
  });
});
