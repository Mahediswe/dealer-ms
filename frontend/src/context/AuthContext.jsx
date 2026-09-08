// import { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import api from '../lib/api';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(() => {
//     const raw = localStorage.getItem('dms_user');
//     return raw ? JSON.parse(raw) : null;
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem('dms_token');
//     if (!token) {
//       setLoading(false);
//       return;
//     }
//     api
//       .get('/auth/me')
//       .then(({ data }) => {
//         setUser(data.user);
//         localStorage.setItem('dms_user', JSON.stringify(data.user));
//       })
//       .catch(() => {
//         localStorage.removeItem('dms_token');
//         localStorage.removeItem('dms_user');
//         setUser(null);
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const login = useCallback(async (email, password) => {
//     const { data } = await api.post('/auth/login', { email, password });
//     localStorage.setItem('dms_token', data.token);
//     localStorage.setItem('dms_user', JSON.stringify(data.user));
//     setUser(data.user);
//     return data.user;
//   }, []);

//   const register = useCallback(async (payload) => {
//     const { data } = await api.post('/auth/register', payload);
//     localStorage.setItem('dms_token', data.token);
//     localStorage.setItem('dms_user', JSON.stringify(data.user));
//     setUser(data.user);
//     return data.user;
//   }, []);

//   const logout = useCallback(() => {
//     localStorage.removeItem('dms_token');
//     localStorage.removeItem('dms_user');
//     setUser(null);
//   }, []);

//   return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
// }

// export const useAuth = () => useContext(AuthContext);












import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { BYPASS_AUTH } from '../lib/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('dms_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dms_token');

    if (!token) {
      if (BYPASS_AUTH) {
        api
          .post('/auth/bypass')
          .then(({ data }) => {
            localStorage.setItem('dms_token', data.token);
            localStorage.setItem('dms_user', JSON.stringify(data.user));
            setUser(data.user);
          })
          .catch(() => setUser(null))
          .finally(() => setLoading(false));
        return;
      }
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('dms_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('dms_token');
        localStorage.removeItem('dms_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('dms_token', data.token);
    localStorage.setItem('dms_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('dms_token', data.token);
    localStorage.setItem('dms_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dms_token');
    localStorage.removeItem('dms_user');
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);