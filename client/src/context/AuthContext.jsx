// One place that answers "who is logged in?" for the whole app.
// With Auth0 settings in client/.env it uses real login; without them it runs in
// "dev mode" (everyone is a guest) so you can build before setting up Auth0.
import { createContext, useContext, useMemo } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
export const authEnabled = Boolean(domain && clientId && audience);

const AuthContext = createContext(null);

const devModeValue = {
  enabled: false,
  isLoading: false,
  isAuthenticated: true,
  user: { name: 'Guest' },
  login: () => {},
  signup: () => {},
  logout: () => {},
  getToken: async () => null,
};

function Auth0Bridge({ children }) {
  const { isLoading, isAuthenticated, user, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();

  const value = useMemo(
    () => ({
      enabled: true,
      isLoading,
      isAuthenticated,
      user,
      login: () => loginWithRedirect({ appState: { returnTo: window.location.pathname } }),
      signup: () => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } }),
      logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
      getToken: () => getAccessTokenSilently(),
    }),
    [isLoading, isAuthenticated, user, loginWithRedirect, logout, getAccessTokenSilently]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  if (!authEnabled) {
    return <AuthContext.Provider value={devModeValue}>{children}</AuthContext.Provider>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ redirect_uri: window.location.origin, audience, scope: 'openid profile email' }}
      cacheLocation="localstorage"
      useRefreshTokens
      useRefreshTokensFallback
      onRedirectCallback={(appState) => navigate(appState?.returnTo || '/', { replace: true })}
    >
      <Auth0Bridge>{children}</Auth0Bridge>
    </Auth0Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
