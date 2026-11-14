// Returns an `api(path, options)` function that automatically adds the login token.
import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../utils/api.js';

export function useApi() {
  const { getToken } = useAuth();
  return useCallback(
    async (path, options = {}) => {
      const token = await getToken().catch(() => null);
      return apiRequest(path, { ...options, token });
    },
    [getToken]
  );
}
