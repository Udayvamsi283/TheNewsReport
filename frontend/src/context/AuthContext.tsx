import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (
    credsOrEmail: { email: string; password: string } | string,
    password?: string
  ) => Promise<AuthResponse>;
  register: (data: { name: string; email: string; password: string }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    avatar?: string;
    preferredLanguage?: string;
    interests?: string[];
  }) => Promise<User>;
  uploadAvatar: (file: File) => Promise<User>;
  removeAvatar: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ['auth-me'],
    queryFn: async () => {
      try {
        return await apiClient.getMe();
      } catch (err: unknown) {
        // Unauthenticated or expired session
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return await apiClient.login(credentials);
    },
    onSuccess: (res) => {
      queryClient.setQueryData(['auth-me'], res.user);
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      return await apiClient.register(data);
    },
    onSuccess: (res) => {
      queryClient.setQueryData(['auth-me'], res.user);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth-me'], null);
      queryClient.clear();
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      name?: string;
      avatar?: string;
      preferredLanguage?: string;
      interests?: string[];
    }) => {
      return await apiClient.updateProfile(data);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth-me'], updatedUser);
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      return await apiClient.uploadAvatar(file);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth-me'], updatedUser);
      queryClient.setQueryData(['currentUser'], updatedUser);
    }
  });

  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.removeAvatar();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth-me'], updatedUser);
      queryClient.setQueryData(['currentUser'], updatedUser);
    }
  });

  const isAuthenticated = Boolean(user && user.status === 'active');
  const isAdmin = Boolean(user && user.role === 'admin' && user.status === 'active');

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated,
        isAdmin,
        login: async (credsOrEmail, password) => {
          const payload = typeof credsOrEmail === 'string'
            ? { email: credsOrEmail, password: password! }
            : credsOrEmail;
          return await loginMutation.mutateAsync(payload);
        },
        register: async (data) => {
          return await registerMutation.mutateAsync(data);
        },
        logout: async () => {
          await logoutMutation.mutateAsync();
        },
        refreshUser: async () => {
          await refetch();
        },
        updateProfile: async (data) => {
          return await updateProfileMutation.mutateAsync(data);
        },
        uploadAvatar: async (file: File) => {
          return await uploadAvatarMutation.mutateAsync(file);
        },
        removeAvatar: async () => {
          return await removeAvatarMutation.mutateAsync();
        }
      }}
    >
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
