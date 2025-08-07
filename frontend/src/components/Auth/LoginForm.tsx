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
  const [error, setError] = useState<string | null>(null);
  const [showErrorMessage, setShowErrorMessage] = useState(false); // New state for error message visibility
  const [backgroundPosition] = useState(initialBackgroundPosition);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (error) {
      setShowErrorMessage(true);
      timer = setTimeout(() => {
        setShowErrorMessage(false);
        setError(null); // Clear error message after hiding
      }, 7000); // Auto-hide after 7 seconds
    }
    return () => clearTimeout(timer);
  }, [error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) {
      setError(null); // Clear error when user starts typing
      setShowErrorMessage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError(null);
    setShowErrorMessage(false); // Hide previous error message immediately
    try {
      await login(formData.username, formData.password);
      if (onLoginSuccess) onLoginSuccess();
      navigate(redirectTo);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      // The useEffect will handle setting showErrorMessage to true and auto-hiding
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
          <div className={cn("eaura-login-box", { "shake": showErrorMessage })}> {/* Apply shake class */}
            <h2>Login</h2>

            {/* Inline Error Message */}
            {error && showErrorMessage && (
              <div className="eaura-error-message">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span> Access denied. Only registered and authorized users can log in to EA-AURA. Please contact your admin for access.</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                className="eaura-input"
                type="text"
                name="username"
                placeholder="Enter username or email"
                value={formData.username}
                onChange={handleInputChange}
                disabled={isLoading}
                autoComplete="username"
              />

              <div className="eaura-password-wrapper">
                <Input
                  className="eaura-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
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