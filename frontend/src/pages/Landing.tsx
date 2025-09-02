import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useKeycloakRoles } from '@/hooks/useKeycloakRoles';
import WelcomePage from '@/components/WelcomePage';
import WelcomeBackPage from '@/components/WelcomeBackPage';
import { cn } from '@/lib/utils';
import { format } from 'date-fns'; // Import format from date-fns

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
  const userDomain = user?.domain || "AI"; // Extract domain from email

  // State for dynamic last activity
  const [lastActivity, setLastActivity] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Removed automatic redirect - let user manually click buttons

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTimestamp = localStorage.getItem('last_activity_timestamp');
      if (storedTimestamp) {
        try {
          const date = new Date(parseInt(storedTimestamp, 10));
          setLastActivity(format(date, 'h:mm a, dd MMMM yyyy'));
        } catch (e) {
          console.error("Error parsing last activity timestamp:", e);
          setLastActivity(null); // Reset if parsing fails
        }
      } else {
        setLastActivity(null); // No timestamp found
      }
    }
  }, [isAuthenticated]); // Re-run when auth state changes

  const handleRedirectBasedOnRole = () => {
    const isAdmin = clientRoles.some(role => role.toLowerCase() === 'admin');
    const isUser = clientRoles.some(role => role.toLowerCase() === 'user');

    if (isAdmin) {
      navigate('/settings');
    } else if (isUser) {
      // For 'user' role, always redirect to dashboard and set 'overview' as active agent
      localStorage.setItem('last_active_agent_user_role', 'overview');
      navigate('/dashboard');
    } else {
      // Fallback if no specific role is matched
      navigate('/dashboard');
    }
  };

  const handleGetStarted = () => {
    localStorage.setItem('is_returning_user', 'true');
    setIsNewUser(false);
    handleRedirectBasedOnRole();
  };

  const handleContinue = () => {
    handleRedirectBasedOnRole();
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
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 to-indigo-950"> {/* Changed justify-start to justify-center and removed p-4 */}
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
        <WelcomeBackPage 
          userName={fullName} 
          fullName={fullName} 
          lastActivity={lastActivity || "This is your first login"} // Pass dynamic or default message
          userDomain={userDomain} 
          onContinue={handleContinue} 
        />
      )}
    </div>
  );
};

export default Landing;