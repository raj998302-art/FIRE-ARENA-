'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  walletBalance: number;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for token in localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('fire_arena_token');
    if (storedToken) {
      try {
        const decoded: any = jwtDecode(storedToken);
        // Check if token is expired
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          // In a real app, you would fetch user data from API
          setUser({
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            walletBalance: 0 // Would come from API
          });
        } else {
          localStorage.removeItem('fire_arena_token');
        }
      } catch (error) {
        localStorage.removeItem('fire_arena_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (tokenString: string) => {
    setToken(tokenString);
    localStorage.setItem('fire_arena_token', tokenString);
    
    try {
      const decoded: any = jwtDecode(tokenString);
      setUser({
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        walletBalance: 0 // Would come from API
      });
    } catch (error) {
      console.error('Failed to decode token', error);
      setUser(null);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fire_arena_token');
  };

  const isAuthenticated = !!token && !!user;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
