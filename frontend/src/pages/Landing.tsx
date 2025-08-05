import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useKeycloakRoles } from '@/hooks/useKeycloakRoles';
import { useKeycloak } from '@/components/Auth/KeycloakProvider'; // Import useKeycloak
import WelcomePage from '@/components/WelcomePage';
import WelcomeBackPage from '@/components/WelcomeBackPage';
import RoleAvatar from '@/components/RoleAvatar';
import { cn } from '@/lib/utils';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { clientRoles } = useKeycloakRoles(); // Removed 'loading' from destructuring
  const { loading: keycloakLoading } = useKeycloak(); // Get loading from useKeycloak

  // Simulate isNewUser flag using localStorage
  const [isNewUser, setIsNewUser] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('is_returning_user') !== 'true';
    }
    return true; // Default to true on server-side render
  });

  const userName = user?.preferred_username || user?.name || "User";
  const userEmail = user?.email || "user@example.com";
  const userDomain = userEmail.split('@')[1] || "example.com"; // Extract domain from email

  // Placeholder for last activity
  const lastActivity = "Dashboard viewed 5 minutes ago";

  useEffect(() => {
    if (!authLoading && !keycloakLoading && !isAuthenticated) { // Use keycloakLoading here
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, keycloakLoading, navigate]); // Add keycloakLoading to dependencies

  const handleGetStarted = () => {
    localStorage.setItem('is_returning_user', 'true');
    setIsNewUser(false);
    navigate('/dashboard'); // Redirect to dashboard after "Get Started"
  };

  const handleContinue = () => {
    navigate('/dashboard'); // Redirect to dashboard for returning users
  };

  if (authLoading || keycloakLoading) { // Use keycloakLoading here
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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-blue-900 to-indigo-950">
      {/* Background animation/pattern - simplified for now */}
      <div className="absolute inset-0 z-0 opacity-30" style={{
        backgroundImage: 'url(https://i.postimg.cc/XYTD244P/luke-jones-Jc-EEIM963o-M-unsplash-1.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(2px) brightness(0.7)'
      }}></div>
      <div className="absolute inset-0 z-10 bg-black opacity-50"></div> {/* Dark overlay */}

      <div className="relative z-20 w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 md:p-10 flex flex-col items-center">
        {/* Role Avatar at top-right */}
        <div className="absolute top-6 right-6">
          <RoleAvatar />
        </div>

        {isNewUser ? (
          <WelcomePage userName={userName} onGetStarted={handleGetStarted} />
        ) : (
          <WelcomeBackPage userName={userName} lastActivity={lastActivity} userDomain={userDomain} onContinue={handleContinue} />
        )}
      </div>
    </div>
  );
};

export default Landing;