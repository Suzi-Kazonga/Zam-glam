# Zamglam Frontend Setup Guide

## Prerequisites

- Node.js 16+ and npm
- Browser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Development Server

Start the Vite dev server with hot reload:

```bash
npm run dev
```

The app will run at `http://localhost:3000`

### 3. Production Build

Build optimized production bundle:

```bash
npm run build
```

Output will be in `dist/` folder.

## Frontend Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   ├── ProductCard.jsx     # Product grid card
│   │   ├── DashboardSidebar.jsx # Dashboard left sidebar
│   │   └── CourierInfo.jsx     # Delivery info display
│   ├── pages/
│   │   ├── Home.jsx            # Product listing page
│   │   ├── ProductDetail.jsx   # Product detail page
│   │   ├── LoginPage.jsx       # Login form
│   │   ├── SignupCustomer.jsx  # Customer registration
│   │   ├── SignupSeller.jsx    # Seller registration
│   │   ├── CustomerDashboard.jsx
│   │   └── SellerDashboard.jsx
│   ├── context/
│   │   ├── AuthContext.jsx     # Auth state (login, user)
│   │   └── CartContext.jsx     # Cart state (items, total)
│   ├── services/
│   │   └── api.js              # Axios instance with interceptors
│   ├── App.jsx                 # Main router component
│   ├── main.jsx                # React entry point
│   └── index.css               # Tailwind base styles
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Utility-based styling
- **Axios** - HTTP client with request interceptor for JWT

## Architecture

### Separation of Concerns

- **Components**: Reusable UI elements (buttons, cards, sidebars)
- **Pages**: Full-page views rendered by router
- **Services**: API communication layer
- **Context**: Global state (auth, cart)

### Key Features

#### Authentication Context
```javascript
{
  user,        // Current user object
  loading,     // Loading state
  error,       // Error message
  login(),     // Login function
  register(),  // Register function
  logout()     // Logout function
}
```

Stores JWT token in localStorage for persistence.

#### Cart Context
```javascript
{
  cart,            // Array of cart items
  addToCart(),     // Add product to cart
  removeFromCart(),// Remove product
  updateQuantity(),// Change quantity
  clearCart(),     // Empty cart
  getTotalItems(), // Item count
  getTotalPrice()  // Total amount
}
```

Cart persists to localStorage automatically.

#### API Service
Axios instance with automatic JWT token injection:

```javascript
// All requests automatically include:
// Authorization: Bearer <token>
```

## Styling with Tailwind

### Utility Classes Used

**Navbar**
```html
<nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
```

**Product Card**
```html
<div className="border rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col">
```

**Dashboard Layout**
```html
<div className="flex min-h-screen">
  <aside className="w-64 bg-gray-100 p-4"><!-- Sidebar --></aside>
  <main className="flex-1 p-6"><!-- Content --></main>
</div>
```

**Form Inputs**
```html
<input className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-black" />
```

All styles are DOM-friendly and can be easily edited.

## Page Routes

```
/                    - Home (product listing)
/login               - Login form
/signup              - Choose signup type
/signup/customer     - Customer registration
/signup/seller       - Seller registration
/product/:id         - Product detail page
/customer/dashboard  - Customer dashboard
/seller/dashboard    - Seller dashboard
```

## User Flow

### Customer Flow
1. `/signup/customer` - Register account
2. `/` - Browse products
3. `/product/:id` - View product details
4. Add to cart → stored in localStorage
5. `/customer/dashboard` - View orders and cart

### Seller Flow
1. `/signup/seller` - Register shop
2. `/seller/dashboard` - Manage products and orders
3. View sales analytics

## Development Workflow

### Hot Reload
Changes to `.jsx` and `.css` files automatically reload in the browser.

### Building
```bash
npm run build
```

Creates optimized production build with:
- Code splitting
- Minified CSS & JS
- Asset optimization

### Environment Variables

Create `.env.local`:
```env
VITE_API_URL=http://localhost:5000
```

Access in code: `import.meta.env.VITE_API_URL`

## Key Components

### Navbar
- Links to home, products, dashboard
- Signup/Login buttons
- Responsive on mobile

### ProductCard
- Product image, name, price
- Stock indicator
- Add to cart button

### DashboardSidebar
- Navigation for dashboard sections
- Role-specific menu items
- Responsive collapse on mobile

### CourierInfo
- Displays delivery information
- Driver name, price, distance, direction
- Integration with Yango API

## Context API Usage

### Using AuthContext
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  
  if (!user) return <div>Not logged in</div>;
  return <div>Welcome, {user.name}!</div>;
}
```

### Using CartContext
```javascript
import { useCart } from '../context/CartContext';

function MyComponent() {
  const { cart, addToCart, getTotalPrice } = useCart();
  
  return <div>Items: {cart.length}, Total: K{getTotalPrice()}</div>;
}
```

## API Integration

### Making Requests

All requests automatically include the JWT token:

```javascript
import api from '../services/api';

// GET
const { data } = await api.get('/products');

// POST
const { data } = await api.post('/auth/customer/signup', {
  name: 'John',
  email: 'john@example.com',
  password: 'secret'
});

// Error handling
try {
  await api.get('/products');
} catch (error) {
  console.error(error.response.data.message);
}
```

## Debugging

### Browser DevTools
- React Developer Tools extension
- Network tab to inspect API calls
- Application tab for localStorage/tokens

### Console Logs
Add debugging:
```javascript
console.log('Auth user:', user);
console.log('Cart items:', cart);
```

## Performance Tips

- Lazy load routes with `React.lazy()`
- Memoize expensive components with `React.memo()`
- Use `useCallback` for stable function references
- Optimize images with proper sizing

## Troubleshooting

### "Cannot find module" errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API requests failing
- Check backend is running on port 5000
- Verify JWT token in localStorage
- Check network tab in DevTools

### Styling not applying
- Rebuild Tailwind: included automatically with Vite
- Check className spellings
- Clear browser cache

## Building for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

Deploy `dist/` folder to any static hosting (Netlify, Vercel, etc.)
