import React from 'react';
import LoginForm from '@/components/Auth/LoginForm'; // Corrected import path

const LoginPage: React.FC = () => {
  const handleLoginSuccess = () => {
    console.log('Login successful!');
    // You can add any additional logic here
  };

  return (
    <LoginForm 
      onLoginSuccess={handleLoginSuccess}
      redirectTo="/landing" // Ensure this is set to /landing
      initialBackgroundPosition="50% center" // Set the background position to 50% center
    />
  );
};

export default LoginPage;