import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { User, LoginRequest, LoginResponse } from '@/types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = apiClient.getToken();
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Try Super Admin endpoint first
        let response = await apiClient.get<{ success: boolean; user: User }>('/superadmin/me');
        
        if (response.success && response.user) {
          setUser(response.user);
          setIsLoading(false);
          return;
        }
      } catch (superAdminError) {
        // Super Admin check failed, try Pharma Admin endpoint
        try {
          const response = await apiClient.get<{ success: boolean; user: User }>('/admin/me');
          
          if (response.success && response.user) {
            setUser(response.user);
            setIsLoading(false);
            return;
          }
        } catch (pharmaAdminError) {
          // Both endpoints failed, token is invalid
          console.error('Auth check failed for both user types');
        }
      }
      
      // If we reach here, authentication failed
      apiClient.setToken(null);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{ success: boolean; data: LoginResponse }>('/auth/login', credentials);
      
      if (response.success && response.data?.token) {
        apiClient.setToken(response.data.token);
        
        // Fetch full user profile with role metadata
        try {
          // Try Super Admin endpoint first
          const superAdminResponse = await apiClient.get<{ success: boolean; user: User }>('/superadmin/me');
          
          if (superAdminResponse.success && superAdminResponse.user) {
            setUser(superAdminResponse.user);
            setIsLoading(false);
            return;
          }
        } catch (superAdminError) {
          // Super Admin check failed, try Pharma Admin endpoint
          try {
            const pharmaAdminResponse = await apiClient.get<{ success: boolean; user: User }>('/admin/me');
            
            if (pharmaAdminResponse.success && pharmaAdminResponse.user) {
              setUser(pharmaAdminResponse.user);
              setIsLoading(false);
              return;
            }
          } catch (pharmaAdminError) {
            // Both endpoints failed, token is invalid
            console.error('Failed to fetch user profile after login');
            apiClient.setToken(null); // Clear invalid token
            throw new Error('Failed to fetch user profile');
          }
        }
        
        // If we reach here, profile fetch failed
        apiClient.setToken(null);
        throw new Error('Failed to fetch user profile');
      } else {
        throw new Error('Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
