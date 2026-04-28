import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthState, User} from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@race_wars_token';
const USER_KEY = '@race_wars_user';

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userJson = await AsyncStorage.getItem(USER_KEY);
      const user = userJson ? JSON.parse(userJson) : null;

      if (token && user) {
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    // TODO: Implement actual API call
    const mockUser: User = {
      id: '1',
      email,
      displayName: email.split('@')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const mockToken = 'mock-jwt-token';

    await AsyncStorage.setItem(TOKEN_KEY, mockToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(mockUser));

    setAuthState({
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const loginWithGoogle = async () => {
    // TODO: Implement Google OAuth
    console.log('Google login not implemented yet');
  };

  const loginWithApple = async () => {
    // TODO: Implement Apple OAuth
    console.log('Apple login not implemented yet');
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);

    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    // TODO: Implement actual API call
    const mockUser: User = {
      id: '1',
      email,
      displayName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const mockToken = 'mock-jwt-token';

    await AsyncStorage.setItem(TOKEN_KEY, mockToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(mockUser));

    setAuthState({
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        loginWithGoogle,
        loginWithApple,
        logout,
        register,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
