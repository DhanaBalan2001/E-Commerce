import { useState, useCallback } from 'react';
import { authService, adminAuthService } from '../services';
import { useApi, useMutation } from './useApi';

export const useAuth = () => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());

  const sendOTPMutation = useMutation(authService.sendOTP);
  
  const verifyOTPMutation = useMutation(authService.verifyOTP, {
    onSuccess: (data) => {
      setUser(data.user);
      setIsAuthenticated(true);
    }
  });

  const updateProfileMutation = useMutation(authService.updateProfile, {
    onSuccess: (data) => {
      setUser(data.user);
    }
  });

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    isAuthenticated,
    sendOTP: sendOTPMutation,
    verifyOTP: verifyOTPMutation,
    updateProfile: updateProfileMutation,
    logout
  };
};

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState(() => adminAuthService.getCurrentAdmin());
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminAuthService.isAuthenticated());

  const loginMutation = useMutation(adminAuthService.login, {
    onSuccess: (data) => {
      setAdmin(data.admin);
      setIsAuthenticated(true);
    }
  });

  const createFirstAdminMutation = useMutation(adminAuthService.createFirstAdmin, {
    onSuccess: (data) => {
      setAdmin(data.admin);
      setIsAuthenticated(true);
    }
  });

  const logout = useCallback(() => {
    adminAuthService.logout();
    setAdmin(null);
    setIsAuthenticated(false);
  }, []);

  return {
    admin,
    isAuthenticated,
    login: loginMutation,
    createFirstAdmin: createFirstAdminMutation,
    logout
  };
};
