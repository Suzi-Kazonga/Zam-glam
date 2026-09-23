import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomerSignUp from '../components/auth/CustomerSignUp';
import SellerSignUp from '../components/auth/SellerSignUp';
import '../styles/auth.css';

function SignUpPage() {
  const [role, setRole] = useState(null); // null = role selection, 'customer' or 'seller'
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate(user.role === 'seller' ? '/seller/dashboard' : '/');
    return null;
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        {!role ? (
          // Role Selection Screen
          <div className="role-selection">
            <div className="role-header">
              <h1>Welcome to Zamglam</h1>
              <p>Create an account as</p>
            </div>

            <div className="role-cards">
              <div
                className="role-card customer-card"
                onClick={() => setRole('customer')}
              >
                <div className="role-icon">🛍️</div>
                <h2>Customer</h2>
                <p>Browse and buy products from local sellers</p>
                <ul className="role-benefits">
                  <li>✓ Browse products</li>
                  <li>✓ Add to cart</li>
                  <li>✓ Track orders</li>
                  <li>✓ Save favorites</li>
                </ul>
                <button className="role-button customer-button">
                  Sign Up as Customer
                </button>
              </div>

              <div
                className="role-card seller-card"
                onClick={() => setRole('seller')}
              >
                <div className="role-icon">🏪</div>
                <h2>Seller</h2>
                <p>Start selling your products to thousands of customers</p>
                <ul className="role-benefits">
                  <li>✓ Create store</li>
                  <li>✓ List products</li>
                  <li>✓ Manage orders</li>
                  <li>✓ Track sales</li>
                </ul>
                <button className="role-button seller-button">
                  Sign Up as Seller
                </button>
              </div>
            </div>

            <div className="login-redirect">
              <p>
                Already have an account?{' '}
                <a href="/login" className="login-link">
                  Log in here
                </a>
              </p>
            </div>
          </div>
        ) : (
          // Role-Specific Sign Up Form
          <div className="signup-form-container">
            <button
              className="back-button"
              onClick={() => setRole(null)}
              title="Go back to role selection"
            >
              ← Back
            </button>

            {role === 'customer' ? (
              <CustomerSignUp onSignUpSuccess={() => navigate('/')} />
            ) : (
              <SellerSignUp onSignUpSuccess={() => navigate('/seller/dashboard')} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SignUpPage;
