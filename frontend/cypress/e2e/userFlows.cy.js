/**
 * E2E Test - User Login Flow
 * Tests customer login functionality
 */

describe('Customer Login Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display login form on login page', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Login');
  });

  it('should login successfully with valid credentials', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('customer@zamglam.com');
    cy.get('input[type="password"]').type('ValidPassword123');
    cy.get('button[type="submit"]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome');
  });

  it('should show error message with invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('invalid@email.com');
    cy.get('input[type="password"]').type('WrongPassword');
    cy.get('button[type="submit"]').click();
    
    cy.get('[data-testid="error-toast"]').should('contain', 'Invalid credentials');
  });

  it('should require email field', () => {
    cy.visit('/login');
    cy.get('input[type="password"]').type('SomePassword123');
    cy.get('button[type="submit"]').click();
    
    cy.get('[data-testid="error-message"]').should('contain', 'Email is required');
  });
});

/**
 * E2E Test - Browse Products Flow
 * Tests product browsing and filtering
 */

describe('Browse Products Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display product list on home page', () => {
    cy.get('[data-testid="product-grid"]').should('be.visible');
    cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0);
  });

  it('should filter products by category', () => {
    cy.get('[data-testid="category-filter"]').select('accessories');
    cy.get('[data-testid="product-card"]').each(($card) => {
      cy.wrap($card).should('contain', 'accessories');
    });
  });

  it('should search for products', () => {
    cy.get('[data-testid="search-input"]').type('handbag');
    cy.get('[data-testid="search-button"]').click();
    
    cy.get('[data-testid="product-card"]').should('contain', 'handbag');
  });

  it('should view product details', () => {
    cy.get('[data-testid="product-card"]').first().click();
    cy.url().should('include', '/products/');
    cy.get('[data-testid="product-name"]').should('be.visible');
    cy.get('[data-testid="product-description"]').should('be.visible');
    cy.get('[data-testid="product-price"]').should('be.visible');
  });
});

/**
 * E2E Test - Add to Cart and Checkout Flow
 * Tests complete shopping flow from browsing to checkout
 */

describe('Add to Cart and Checkout Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    // Assume user is logged in or we can skip login for this test
  });

  it('should add product to cart', () => {
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="add-to-cart-btn"]').click();
    });
    
    cy.get('[data-testid="success-toast"]').should('contain', 'Added to cart');
    cy.get('[data-testid="cart-count"]').should('contain', '1');
  });

  it('should open cart and review items', () => {
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="add-to-cart-btn"]').click();
    });
    
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="cart-item"]').should('have.length.greaterThan', 0);
  });

  it('should proceed to checkout', () => {
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="add-to-cart-btn"]').click();
    });
    
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="checkout-btn"]').click();
    
    cy.url().should('include', '/checkout');
    cy.get('[data-testid="delivery-form"]').should('be.visible');
  });

  it('should complete checkout successfully', () => {
    // Add item to cart
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="add-to-cart-btn"]').click();
    });
    
    // Go to checkout
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="checkout-btn"]').click();
    
    // Fill delivery information
    cy.get('[data-testid="delivery-address"]').type('123 Main Street, Lusaka');
    cy.get('[data-testid="phone-number"]').type('0977123456');
    
    // Select delivery method
    cy.get('[data-testid="delivery-method"]').select('standard');
    
    // Place order
    cy.get('[data-testid="place-order-btn"]').click();
    
    // Verify order confirmation
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
    cy.get('[data-testid="order-number"]').should('contain', 'Order #');
  });

  it('should track order after checkout', () => {
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
    cy.get('[data-testid="track-order-btn"]').click();
    
    cy.url().should('include', '/orders/');
    cy.get('[data-testid="order-status"]').should('contain', 'Processing');
  });
});

/**
 * E2E Test - Chat and Notifications
 * Tests chat functionality and toast notifications
 */

describe('Chat and Notifications', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display notification toast on cart action', () => {
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="add-to-cart-btn"]').click();
    });
    
    cy.get('[data-testid="success-toast"]').should('be.visible');
    cy.get('[data-testid="success-toast"]').should('contain', 'Added to cart');
  });

  it('should display order confirmation notification', () => {
    // Simulate order placement
    cy.visit('/checkout');
    cy.get('[data-testid="place-order-btn"]').click();
    
    cy.get('[data-testid="success-toast"]').should('contain', 'Order confirmed');
  });

  it('should open chat with seller', () => {
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="chat-btn"]').click();
    });
    
    cy.get('[data-testid="chat-modal"]').should('be.visible');
    cy.get('[data-testid="message-input"]').should('be.visible');
  });

  it('should send chat message', () => {
    cy.get('[data-testid="chat-btn"]').first().click();
    cy.get('[data-testid="message-input"]').type('Is this product available?');
    cy.get('[data-testid="send-message-btn"]').click();
    
    cy.get('[data-testid="sent-message"]').should('contain', 'Is this product available?');
  });
});
