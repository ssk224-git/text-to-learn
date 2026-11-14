// Keeps the list of "my courses" so the sidebar and home page share one copy.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';

const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const { isLoading, isAuthenticated } = useAuth();
  const api = useApi();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setCourses([]);
      return;
    }
    setLoading(true);
    try {
      setCourses(await api('/api/courses'));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated]);

  useEffect(() => {
    if (!isLoading) reload();
  }, [isLoading, reload]);

  return (
    <CoursesContext.Provider value={{ courses, setCourses, loading, error, reload }}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  return useContext(CoursesContext);
}
