// Single source of truth for the bypass-mode flag, read from Vite env at
// build time. Used by both AuthContext (to auto-login) and the router (to
// redirect away from /login and /register while bypass is active).
export const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';