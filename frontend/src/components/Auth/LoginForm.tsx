"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react'; // Import AlertCircle
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

import './LoginForm.css';

interface LoginFormProps {
  onLoginSuccess?: () => void;
  redirectTo?: string;
  initialBackgroundPosition?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  redirectTo = '/landing',
  initialBackgroundPosition = '25% center',
}) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New states for validation errors
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null); // For top-level messages
  const [showGeneralErrorMessage, setShowGeneralErrorMessage] = useState(false); // For general error message visibility and shake

  const [backgroundPosition] = useState(initialBackgroundPosition);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (generalError) {
      setShowGeneralErrorMessage(true);
      timer = setTimeout(() => {
        setShowGeneralErrorMessage(false);
        setGeneralError(null); // Clear general error message after hiding
      }, 7000); // Auto-hide after 7 seconds
    }
    return () => clearTimeout(timer);
  }, [generalError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear specific field error when user starts typing in that field
    if (name === 'username' && usernameError) setUsernameError(null);
    if (name === 'password' && passwordError) setPasswordError(null);

    // Clear general error message and hide it when any input changes
    if (generalError) {
      setGeneralError(null);
      setShowGeneralErrorMessage(false);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'username' && !value.trim()) {
      setUsernameError("Please fill that field");
    }
    if (name === 'password' && !value.trim()) {
      setPasswordError("Please fill that field");
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    let newUsernameError: string | null = null;
    let newPasswordError: string | null = null;
    let newGeneralError: string | null = null;

    if (!formData.username.trim()) {
      newUsernameError = "Please fill that field";
      isValid = false;
    }
    if (!formData.password.trim()) {
      newPasswordError = "Please fill that field";
      isValid = false;
    }

    if (!isValid) {
      if (newUsernameError && newPasswordError) {
        newGeneralError = "Please fill in the details below";
      }
    }

    setUsernameError(newUsernameError);
    setPasswordError(newPasswordError);
    setGeneralError(newGeneralError);
    setShowGeneralErrorMessage(!!newGeneralError); // Show general error if it exists

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear all previous errors before new submission attempt
    setUsernameError(null);
    setPasswordError(null);
    setGeneralError(null);
    setShowGeneralErrorMessage(false);

    if (!validateForm()) {
      return; // Stop if client-side validation fails
    }

    setIsLoading(true);

    try {
      await login(formData.username, formData.password);
      // Successful login
      if (onLoginSuccess) onLoginSuccess();
      navigate(redirectTo);
    } catch (err: any) {
      console.error('Login error:', err);
      const backendErrorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';

      // Check for specific Keycloak error messages if available
      if (backendErrorMessage.includes("invalid_grant") || backendErrorMessage.includes("invalid username or password")) {
        setPasswordError("Incorrect Password");
        setGeneralError("Access denied. Only registered and authorized users can log in to EA-AURA. Please contact your admin for access.");
      } else {
        setGeneralError(backendErrorMessage);
      }
      setShowGeneralErrorMessage(true); // Trigger shake and visibility for the general error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="eaura-body" style={{ backgroundPosition }}>
      <div className="eaura-container">
        {/* Left Section */}
        <div className="eaura-left">
          <h1>EA-AURA</h1>
          <p>Vision. Velocity. Value</p>
        </div>

        {/* Right Section */}
        <div className="eaura-right">
          <div className={cn("eaura-login-box", { "shake": showGeneralErrorMessage })}> {/* Apply shake class */}
            <h2>Login</h2>
            <p className="eaura-register-text"><h5>Turn Vision into Velocity and Velocity into Value with EA-AURA.ai</h5></p>
            

            {/* Inline General Error Message */}
            {generalError && showGeneralErrorMessage && (
              <div className="eaura-error-message">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span> {generalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                className={cn("eaura-input", { "border-red-500": usernameError })}
                type="text"
                name="username"
                placeholder="Enter username or email"
                value={formData.username}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={isLoading}
                autoComplete="username"
              />
              {usernameError && (
                <p className="text-sm text-red-500 mt-[-15px] mb-[15px] self-start pl-2">{usernameError}</p>
              )}

              <div className="eaura-password-wrapper">
                <Input
                  className={cn("eaura-input", { "border-red-500": passwordError })}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eaura-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-500 mt-[-15px] mb-[15px] self-start pl-2">{passwordError}</p>
              )}

              <Button
                type="submit"
                className="eaura-continue-btn text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <p className="eaura-register-text">
              <br />
              For any query, please{' '}
              <button
                type="button"
                onClick={() => window.location.href = 'https://ea-aura.ai/contact-us/'}
                className="eaura-link"
              >
                Contact Us
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;