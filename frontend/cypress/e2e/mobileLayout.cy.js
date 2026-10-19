/**
 * On a phone, no button sits on top of another: the section menu and the back arrow live
 * in the top bar instead of floating over the page, and nothing pushes the page wider
 * than the screen.
 *
 * Needs the stack running with the demo accounts (password 123456789).
 */

const signIn = (email, role) => {
  cy.visit('/login');
  cy.get('fieldset').contains('button', role).click();
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type('123456789');
  cy.contains('button[type="submit"]', 'Sign in').click();
  cy.location('pathname', { timeout: 15000 }).should('not.eq', '/login');
};

const fitsTheScreen = () => cy.window().then((win) => {
  expect(win.document.documentElement.scrollWidth, 'page width').to.be.at.most(win.innerWidth);
});

// The floating back button is either gone or hidden; the bar's own arrow is the one shown.
const oneBackArrow = () => {
  cy.get('[data-floating-back]').should(($button) => { if ($button.length) expect($button).not.to.be.visible; });
  cy.get('[data-header-back]').should('be.visible');
};

describe('Phone layout', () => {
  beforeEach(() => cy.viewport(390, 844));

  it('opens the dashboard menu from the top bar, with no floating button over the page', () => {
    signIn('admin@zamglam.local', /admin/i);
    cy.visit('/admin/dashboard?section=Overview');
    oneBackArrow();
    fitsTheScreen();

    cy.get('header').find('button[aria-label="Open the menu"]').should('be.visible').click();
    cy.get('[data-dashboard-sidebar]').contains('button', 'Attention').should('be.visible').click();
    cy.get('h1').should('contain', 'Attention');
    cy.get('[data-dashboard-sidebar]').contains('button', 'Attention').should('not.be.visible');
  });

  it('keeps the shop overview and the courier hub within the screen', () => {
    signIn('mud@zamglam.local', /shop|seller/i);
    cy.visit('/seller/dashboard');
    oneBackArrow();
    fitsTheScreen();

    cy.clearLocalStorage();
    signIn('mwansa@zamglamcourier.local', /courier/i);
    cy.visit('/courier/dashboard');
    oneBackArrow();
    fitsTheScreen();
    cy.get('header').find('button[aria-label="Open the menu"]').click();
    cy.get('[data-dashboard-sidebar]').contains('button', 'Completed').should('be.visible');
  });

  it('gives the shop search its own row, so the account menu opens on screen', () => {
    signIn('customer@zamglam.local', /customer/i);
    cy.visit('/products');
    fitsTheScreen();
    cy.get('button[aria-label="Open account menu"]').click();
    cy.get('[role="menu"][aria-label="Account menu"]').then(($menu) => {
      const box = $menu[0].getBoundingClientRect();
      expect(box.left, 'menu left edge').to.be.at.least(0);
      expect(box.right, 'menu right edge').to.be.at.most(390);
    });
  });
});

describe('Customer dashboard buttons', () => {
  beforeEach(() => signIn('customer@zamglam.local', /customer/i));

  it('My Orders shows current and previous orders', () => {
    cy.visit('/');
    cy.get('button[aria-label="Open account menu"]').click();
    cy.contains('[role="menu"] a', 'My Orders').click();
    cy.location('search').should('eq', '?section=Orders');
    cy.contains(/Current orders \(\d+\)/).should('be.visible');
    cy.contains(/Previous orders \(\d+\)/).should('be.visible');
  });

  it('every Dashboard button lands on the Customer space', () => {
    // From the shop's menu.
    cy.visit('/products');
    cy.get('button[aria-label="Open navigation menu"]').click();
    cy.contains('a:visible', /^Dashboard$/).click();
    cy.location('pathname').should('eq', '/customer/dashboard');
    cy.contains('Customer space').should('be.visible');

    // From the profile page, having been in Orders: back to the overview, not Orders.
    cy.visit('/customer/dashboard?section=Orders');
    cy.contains(/Current orders/).should('be.visible');
    cy.visit('/account');
    cy.contains('a', 'Dashboard').click();
    cy.location('pathname').should('eq', '/customer/dashboard');
    cy.contains('Customer space').should('be.visible');
  });
});
