/**
 * The chat as folded conversations, with the unread count beside the chat button.
 *
 * A shopper writes to Mud through the API; the shop then signs in through the browser,
 * sees the count, finds the conversation folded to a name and the last message, opens it,
 * and the count goes. Writes its own messages each run, so it can be run again.
 */

const PASSWORD = '123456789';
const stamp = Date.now();
const first = `Is the denim in a 32? (${stamp})`;
const second = `And in black? (${stamp})`;

const signIn = (email, role) => {
  cy.visit('/login');
  cy.get('fieldset').contains('button', new RegExp(role, 'i')).click();
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(PASSWORD);
  cy.contains('button[type="submit"]', 'Sign in').click();
  cy.location('pathname', { timeout: 15000 }).should('not.eq', '/login');
};

describe('Chat', () => {
  before(() => {
    // The shopper writes twice to Mud.
    cy.request('POST', '/api/auth/login', { email: 'customer@zamglam.local', password: PASSWORD, role: 'customer' })
      .then(({ body }) => {
        const headers = { Authorization: `Bearer ${body.token}` };
        cy.request('/api/stores').then(({ body: stores }) => {
          const mud = (Array.isArray(stores) ? stores : stores.stores || []).find((store) => store.name === 'Mud');
          cy.request({ method: 'POST', url: `/api/messages/threads/${mud.id}`, headers, body: { body: first } });
          cy.request({ method: 'POST', url: `/api/messages/threads/${mud.id}`, headers, body: { body: second } });
        });
      });
  });

  it('the shop sees the unread count, a folded conversation, and the count goes once it is read', () => {
    signIn('mud@zamglam.local', 'seller');

    // The count sits beside the chat button.
    cy.get('a[aria-label*="unread message"]', { timeout: 10000 })
      .should('have.attr', 'aria-label').and('match', /^\d+ unread messages? from customers$/);

    cy.get('[aria-label="Open seller navigation"]').click();
    cy.get('nav[aria-label="Seller dashboard navigation"]').contains('button', 'Messages').click();

    // Folded: the customer's name and the last message, nothing open.
    cy.contains('button', 'John Doe').as('conversation');
    cy.get('@conversation').should('have.attr', 'aria-expanded', 'false');
    cy.get('@conversation').should('contain', second);
    cy.get('@conversation').find('[aria-label$="unread"]').should('exist');
    cy.get('textarea[aria-label="Reply message"]').should('not.exist');

    // Opening it shows the conversation and reads it.
    cy.get('@conversation').click();
    cy.contains(first).should('be.visible');
    cy.get('textarea[aria-label="Reply message"]').should('be.visible');
    cy.get('@conversation').find('[aria-label$="unread"]').should('not.exist');
    cy.get('a[aria-label="Chat with customers"]', { timeout: 10000 }).should('exist');

    // A reply goes back, and the conversation folds shut again on a second click.
    cy.get('textarea[aria-label="Reply message"]').type('Yes, in both.');
    cy.contains('button', 'Send').click();
    cy.contains('Yes, in both.').should('be.visible');
    cy.get('@conversation').click();
    cy.get('textarea[aria-label="Reply message"]').should('not.exist');
    cy.get('@conversation').should('contain', 'You: Yes, in both.');
  });

  it('the shopper is told of the reply beside their own chat button', () => {
    signIn('customer@zamglam.local', 'customer');
    cy.get('a[aria-label*="unread message"]', { timeout: 10000 }).should('exist');
    cy.visit('/customer/dashboard?section=Messages');
    cy.contains('button', 'Mud').should('contain', 'Yes, in both.');
  });
});
