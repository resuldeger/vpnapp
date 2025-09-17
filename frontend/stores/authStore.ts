import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'premium';
  subscription_expires_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  continueAsGuest: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: false,

  continueAsGuest: () => {
    set({
      isGuest: true,
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    });
  },

  register: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password,
      });

      const { access_token, user_id, subscription_tier } = response.data;
      
      // Store token
      await AsyncStorage.setItem('auth_token', access_token);
      
      // Create user object
      const user: User = {
        id: user_id,
        email,
        subscription_tier,
      };

      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(
        error.response?.data?.detail || 'Registration failed'
      );
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { access_token, user_id, subscription_tier } = response.data;
      
      // Store token
      await AsyncStorage.setItem('auth_token', access_token);
      
      // Create user object
      const user: User = {
        id: user_id,
        email,
        subscription_tier,
      };

      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(
        error.response?.data?.detail || 'Login failed'
      );
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      // Set axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch user profile
      const response = await axios.get(`${API_BASE_URL}/auth/profile`);
      const userData = response.data;

      const user: User = {
        id: userData.id,
        email: userData.email,
        subscription_tier: userData.subscription_tier,
        subscription_expires_at: userData.subscription_expires_at,
      };

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Token is invalid, clear it
      await AsyncStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  refreshProfile: async () => {
    try {
      const { token } = get();
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/auth/profile`);
      const userData = response.data;

      const user: User = {
        id: userData.id,
        email: userData.email,
        subscription_tier: userData.subscription_tier,
        subscription_expires_at: userData.subscription_expires_at,
      };

      set({ user });
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  },
}));