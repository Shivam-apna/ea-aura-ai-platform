import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { toast } from 'sonner';

interface DashboardRefreshContextType {
  triggerRefresh: () => void;
  registerRefreshHandler: (handler: (prompt: string) => Promise<void>, currentPrompt: string) => void;
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType | undefined>(undefined);

export const DashboardRefreshProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Using a ref to store the current refresh handler and its associated prompt
  const refreshHandlerRef = useRef<{ handler: (prompt: string) => Promise<void>; prompt: string } | null>(null);

  // Function to register the refresh handler from the active dashboard page
  const registerRefreshHandler = useCallback((handler: (prompt: string) => Promise<void>, currentPrompt: string) => {
    refreshHandlerRef.current = { handler, prompt: currentPrompt };
  }, []);

  // Function to trigger a refresh on the currently registered handler
  const triggerRefresh = useCallback(() => {
    if (refreshHandlerRef.current) {
      toast.info("Refreshing dashboard data...");
      // Call the registered handler with its last known prompt
      refreshHandlerRef.current.handler(refreshHandlerRef.current.prompt);
    } else {
      console.warn('DashboardRefreshContext: No refresh handler registered.');
      toast.error("No dashboard data to refresh. Please generate a dashboard first.");
    }
  }, []);

  return (
    <DashboardRefreshContext.Provider value={{ triggerRefresh, registerRefreshHandler }}>
      {children}
    </DashboardRefreshContext.Provider>
  );
};

export const useDashboardRefresh = () => {
  const context = useContext(DashboardRefreshContext);
  if (context === undefined) {
    throw new Error('useDashboardRefresh must be used within a DashboardRefreshProvider');
  }
  return context;
};