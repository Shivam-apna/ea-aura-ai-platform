import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useKeycloakRoles } from '@/hooks/useKeycloakRoles';
import WelcomePage from '@/components/WelcomePage';
import WelcomeBackPage from '@/components/WelcomeBackPage';
import { cn } from '@/lib/utils';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { clientRoles } = useKeycloakRoles();

  // Simulate isNewUser flag using localStorage
  const [isNewUser, setIsNewUser] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('is_returning_user') !== 'true';
    }
    return true; // Default to true on server-side render
  });
  
  const fullName = user?.name || user?.preferred_username || "User";
  const userEmail = user?.email || "user@example.com";
  const userDomain = user?.domain || "gmail"; // Extract domain from email

  // Placeholder for last activity
  const lastActivity = "Dashboard viewed 5 minutes ago";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleGetStarted = () => {
    localStorage.setItem('is_returning_user', 'true');
    setIsNewUser(false);
    navigate('/dashboard'); // Redirect to dashboard after "Get Started"
  };

  const handleContinue = () => {
    navigate('/dashboard'); // Redirect to dashboard for returning users
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading user data...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Should be redirected by useEffect
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 overflow-hidden bg-gradient-to-br from-blue-900 to-indigo-950">
      {/* Background animation/pattern */}
      <div className="absolute inset-0 z-0 opacity-100" style={{
        backgroundImage: 'url(https://i.postimg.cc/PrSCLDq0/ea-aura-image.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(0px) brightness(1.0)'
      }}></div>

      {/* Main Content Area - now handled by WelcomePage/WelcomeBackPage */}
      {isNewUser ? (
        <WelcomePage userName={fullName} fullName={fullName} userDomain={userDomain} onGetStarted={handleGetStarted} />
      ) : (
        <WelcomeBackPage userName={fullName} fullName={fullName} lastActivity={lastActivity} userDomain={userDomain} onContinue={handleContinue} />
      )}
    </div>
  );
};

export default Landing;