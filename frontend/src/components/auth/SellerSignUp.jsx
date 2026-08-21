import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

function SellerSignUp({ onSignUpSuccess }) {
  const { register, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Basic Info, Step 2: Store Info
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Step 2: Store Information
    storeName: '',
    storeDescription: '',
    businessRegistration: '',
    taxNumber: '',
    agreeToTerms: false,
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateStep = (currentStep) => {
    const errors = {};

    if (currentStep === 1) {
      // Validate personal information
      if (!formData.name.trim()) {
        errors.name = 'Full name is required';
      } else if (formData.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters';
      }

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        errors.phone = 'Please enter a valid 10-digit phone number';
      }
    } else if (currentStep === 2) {
      // Validate store information
      if (!formData.storeName.trim()) {
        errors.storeName = 'Store name is required';
      } else if (formData.storeName.trim().length < 3) {
        errors.storeName = 'Store name must be at least 3 characters';
      }

      if (!formData.storeDescription.trim()) {
        errors.storeDescription = 'Store description is required';
      } else if (formData.storeDescription.trim().length < 10) {
        errors.storeDescription = 'Description must be at least 10 characters';
      }

      if (!formData.businessRegistration.trim()) {
        errors.businessRegistration = 'Business registration number is required';
      }

      if (!formData.taxNumber.trim()) {
        errors.taxNumber = 'Tax number (PAYE) is required';
      }

      if (!formData.agreeToTerms) {
        errors.agreeToTerms = 'You must agree to the terms and conditions';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(step)) {
      return;
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, 'seller');
      // Note: Store creation would happen in a separate flow after account creation
      onSignUpSuccess();
    } catch (err) {
      setValidationErrors({
        submit: error || 'Failed to create account. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-form seller-form">
      <div className="form-header">
        <div className="form-icon">🏪</div>
        <h2>Create Seller Account</h2>
        <p>Start your business journey on Zamglam</p>
        <div className="progress-indicator">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <label>Personal</label>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <label>Store</label>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-group">
        {validationErrors.submit && (
          <div className="error-message error-banner">{validationErrors.submit}</div>
        )}

        {step === 1 ? (
          // Step 1: Personal Information
          <div className="form-step">
            <h3>Your Personal Information</h3>

            <div className="form-section">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`form-input ${validationErrors.name ? 'input-error' : ''}`}
              />
              {validationErrors.name && (
                <span className="error-message">{validationErrors.name}</span>
              )}
            </div>

            <div className="form-section">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seller@example.com"
                className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
              />
              {validationErrors.email && (
                <span className="error-message">{validationErrors.email}</span>
              )}
            </div>

            <div className="form-section">
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+260 9XX XXX XXX"
                className={`form-input ${validationErrors.phone ? 'input-error' : ''}`}
              />
              {validationErrors.phone && (
                <span className="error-message">{validationErrors.phone}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-section">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                />
                {validationErrors.password && (
                  <span className="error-message">{validationErrors.password}</span>
                )}
              </div>

              <div className="form-section">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className={`form-input ${validationErrors.confirmPassword ? 'input-error' : ''}`}
                />
                {validationErrors.confirmPassword && (
                  <span className="error-message">{validationErrors.confirmPassword}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="submit-button seller-submit"
            >
              Continue to Store Setup
            </button>
          </div>
        ) : (
          // Step 2: Store Information
          <div className="form-step">
            <h3>Your Store Information</h3>

            <div className="form-section">
              <label htmlFor="storeName" className="form-label">
                Store Name
              </label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="Your Store Name"
                className={`form-input ${validationErrors.storeName ? 'input-error' : ''}`}
              />
              {validationErrors.storeName && (
                <span className="error-message">{validationErrors.storeName}</span>
              )}
            </div>

            <div className="form-section">
              <label htmlFor="storeDescription" className="form-label">
                Store Description
              </label>
              <textarea
                id="storeDescription"
                name="storeDescription"
                value={formData.storeDescription}
                onChange={handleChange}
                placeholder="Tell customers about your store and products..."
                rows="4"
                className={`form-input textarea ${validationErrors.storeDescription ? 'input-error' : ''}`}
              />
              {validationErrors.storeDescription && (
                <span className="error-message">{validationErrors.storeDescription}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-section">
                <label htmlFor="businessRegistration" className="form-label">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  id="businessRegistration"
                  name="businessRegistration"
                  value={formData.businessRegistration}
                  onChange={handleChange}
                  placeholder="e.g., BRN123456"
                  className={`form-input ${validationErrors.businessRegistration ? 'input-error' : ''}`}
                />
                {validationErrors.businessRegistration && (
                  <span className="error-message">{validationErrors.businessRegistration}</span>
                )}
              </div>

              <div className="form-section">
                <label htmlFor="taxNumber" className="form-label">
                  Tax Number (PAYE)
                </label>
                <input
                  type="text"
                  id="taxNumber"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleChange}
                  placeholder="e.g., ZA0000000"
                  className={`form-input ${validationErrors.taxNumber ? 'input-error' : ''}`}
                />
                {validationErrors.taxNumber && (
                  <span className="error-message">{validationErrors.taxNumber}</span>
                )}
              </div>
            </div>

            <div className="form-section checkbox-section">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className={`form-checkbox ${validationErrors.agreeToTerms ? 'input-error' : ''}`}
              />
              <label htmlFor="agreeToTerms" className="checkbox-label">
                I agree to the Seller Terms and Conditions and understand the commission structure
              </label>
              {validationErrors.agreeToTerms && (
                <span className="error-message">{validationErrors.agreeToTerms}</span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="back-button-form"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="submit-button seller-submit"
              >
                {loading ? 'Creating Account...' : 'Create Seller Account'}
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="form-footer">
        <p>
          Already have an account?{' '}
          <a href="/login" className="link">
            Log in here
          </a>
        </p>
      </div>
    </div>
  );
}

export default SellerSignUp;
