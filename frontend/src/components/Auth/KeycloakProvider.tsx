import React, { useEffect, useState } from 'react';
import keycloak from '@/keycloak';

export const MinimalKeycloakTest: React.FC = () => {
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const testKeycloak = async () => {
      try {
        console.log('Testing minimal Keycloak setup...');
        
        // Most basic initialization possible
        const auth = await keycloak.init({
          onLoad: 'check-sso',
          checkLoginIframe: false,
          enableLogging: true,
        });

        setStatus(`Initialized successfully. Authenticated: ${auth}`);
        
      } catch (error) {
        console.error('Test failed:', error);
        setStatus(`Failed: ${error.message}`);
      }
    };

    testKeycloak();
  }, []);

  const testLogin = () => {
    try {
      console.log('Testing login...');
      keycloak.login({
        redirectUri: window.location.origin,
      });
    } catch (error) {
      console.error('Login test failed:', error);
      setStatus(`Login failed: ${error.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Keycloak Test</h1>
      <p className="mb-4">Status: {status}</p>
      <button 
        onClick={testLogin}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Test Login
      </button>
    </div>
  );
};