import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import './LoginForm.css';
 
interface LoginFormProps {
  onLoginSuccess?: () => void;
  redirectTo?: string;
}
 
export const LoginForm: React.FC<LoginFormProps> = ({ 
  onLoginSuccess, 
  redirectTo = '/landing' // Changed default redirectTo to /landing
}) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await login(formData.username, formData.password);
      if (onLoginSuccess) onLoginSuccess();
      navigate(redirectTo);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
<div className="eaura-body">
<div className="eaura-container">
        {/* Left Section */}
<div className="eaura-left">
<h1>EA-AURA</h1>
<p>Vision. Velocity. Value</p>
</div>
 
        {/* Right Section */}
<div className="eaura-right">
<div className="eaura-login-box">
<h2>Log in</h2>
<p>Exclusive offers, and personalized floral experiences.</p>
 
            {error && <div className="eaura-error">{error}</div>}
 
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
                className="eaura-continue-btn"
                disabled={isLoading}
>
                {isLoading ? 'Signing in...' : 'Continue'}
</Button>
</form>
 
            <p className="eaura-register-text">
              Don't have an account?{' '}
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