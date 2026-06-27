'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import API from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user session on initial boot
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await API.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Login handler
  const login = async (usernameOrEmail, password) => {
    try {
      setLoading(true);
      const res = await API.post('/auth/login', { usernameOrEmail, email: usernameOrEmail, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        router.push('/dashboard');
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid email/name or password'
      };
    } finally {
      setLoading(false);
    }
  };

  // Signup handler (handles file upload via FormData)
  const signup = async (formData) => {
    try {
      setLoading(true);
      const res = await API.post('/auth/signup', formData);

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        router.push('/dashboard');
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Check inputs.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout API warning:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      router.push('/');
    }
  };

  // Update user profile locally after editing
  const updateProfileLocally = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfileLocally
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
