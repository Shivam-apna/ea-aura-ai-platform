import React from 'react';
import LoginForm from '@/components/Auth/LoginForm';

const LoginPage: React.FC = () => {
  const handleLoginSuccess = () => {
    console.log('Login successful!');
    // You can add any additional logic here
  };

  return (
    <LoginForm 
      onLoginSuccess={handleLoginSuccess}
      redirectTo="/dashboard"
    />
  );
};

export default LoginPage; 