import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

/**
 * Mock Button Component for testing
 */
const Button = ({ onClick, children, disabled = false }) => (
  <button onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

/**
 * Sample component test
 */
describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByText('Click me');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    
    const button = screen.getByText('Click me');
    expect(button).toBeDisabled();
    
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('applies disabled attribute correctly', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByText('Disabled Button')).toBeDisabled();
  });
});

/**
 * Mock Product Card Component for testing
 */
const ProductCard = ({ product, onAddToCart }) => (
  <div data-testid="product-card">
    <h3>{product.name}</h3>
    <p>{product.description}</p>
    <p>ZMW {product.price}</p>
    <button onClick={() => onAddToCart(product)}>Add to Cart</button>
  </div>
);

describe('ProductCard Component', () => {
  const mockProduct = {
    id: 1,
    name: 'Premium Handbag',
    description: 'Luxury leather handbag',
    price: 50000
  };

  test('renders product information', () => {
    render(
      <ProductCard product={mockProduct} onAddToCart={jest.fn()} />
    );
    
    expect(screen.getByText('Premium Handbag')).toBeInTheDocument();
    expect(screen.getByText('Luxury leather handbag')).toBeInTheDocument();
    expect(screen.getByText('ZMW 50000')).toBeInTheDocument();
  });

  test('calls onAddToCart when button clicked', async () => {
    const handleAddToCart = jest.fn();
    render(
      <ProductCard product={mockProduct} onAddToCart={handleAddToCart} />
    );
    
    const addButton = screen.getByText('Add to Cart');
    await userEvent.click(addButton);
    
    expect(handleAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  test('renders product card with test ID', () => {
    render(
      <ProductCard product={mockProduct} onAddToCart={jest.fn()} />
    );
    
    expect(screen.getByTestId('product-card')).toBeInTheDocument();
  });
});

/**
 * Mock Toast Notification Component for testing
 */
const Toast = ({ message, type = 'info', visible = false }) => (
  <div data-testid="toast" style={{ display: visible ? 'block' : 'none' }} className={`toast toast-${type}`}>
    {message}
  </div>
);

describe('Toast Notification Component', () => {
  test('renders toast when visible', () => {
    render(
      <Toast message="Item added to cart" type="success" visible={true} />
    );
    
    expect(screen.getByText('Item added to cart')).toBeInTheDocument();
  });

  test('does not render toast when hidden', () => {
    const { container } = render(
      <Toast message="Item added to cart" type="success" visible={false} />
    );
    
    expect(container.querySelector('[style*="display: none"]')).toBeInTheDocument();
  });

  test('applies correct toast type class', () => {
    render(
      <Toast message="Error occurred" type="error" visible={true} />
    );
    
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('toast-error');
  });
});
