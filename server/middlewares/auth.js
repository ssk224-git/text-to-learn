// Checks the "Authorization: Bearer <token>" header sent by the React app.
// If Auth0 isn't configured yet, everyone is treated as one local "dev-user" so the app
// still works while you build it.
import { auth } from 'express-oauth2-jwt-bearer';
import { env, authEnabled } from '../config/env.js';
import User from '../models/User.js';

const jwtCheck = authEnabled
  ? auth({ audience: env.auth0Audience, issuerBaseURL: env.auth0Issuer, tokenSigningAlg: 'RS256' })
  : null;

const knownUsers = new Set();

// Saves the user's name/email the first time we see them (best effort, never blocks the request).
async function syncUser(sub, authorization) {
  if (knownUsers.has(sub)) return;
  knownUsers.add(sub);
  try {
    if (await User.exists({ sub })) return;
    const res = await fetch(new URL('userinfo', env.auth0Issuer.replace(/\/?$/, '/')), {
      headers: { Authorization: authorization },
    });
    const info = res.ok ? await res.json() : {};
    await User.updateOne(
      { sub },
      { $set: { email: info.email, name: info.name, picture: info.picture } },
      { upsert: true }
    );
  } catch (err) {
    knownUsers.delete(sub);
    console.warn('[auth] could not sync user profile:', err.message);
  }
}

export function requireAuth(req, res, next) {
  if (!jwtCheck) {
    req.user = { sub: 'dev-user' };
    return next();
  }
  jwtCheck(req, res, (err) => {
    if (err) return next(err);
    req.user = { sub: req.auth.payload.sub };
    syncUser(req.user.sub, req.headers.authorization);
    next();
  });
}
