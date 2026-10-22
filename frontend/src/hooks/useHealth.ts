import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { HealthResponse } from '../types';

export const useHealth = () => {
  return useQuery<HealthResponse, Error>({
    queryKey: ['system-health'],
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: 2,
    staleTime: 10000
  });
};
