import React, { createContext, useContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Check for token in AsyncStorage on initial load
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('fire_arena_token');
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
              await AsyncStorage.removeItem('fire_arena_token');
            }
          } catch (error) {
            await AsyncStorage.removeItem('fire_arena_token');
          }
        }
      } catch (error) {
        console.error('Error loading token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  const login = async (tokenString: string) => {
    setToken(tokenString);
    await AsyncStorage.setItem('fire_arena_token', tokenString);
    
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

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('fire_arena_token');
  };

  const isAuthenticated = !!token && !!user;

  if (isLoading) {
    return null; // Return null while loading to avoid rendering UI prematurely
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
