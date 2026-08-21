// CONFIGURAÇÃO CENTRAL
// IDs, URLs e chaves usados em mais de um arquivo do site.
// Muda aqui uma vez, aplica em todo lugar que importa daqui —
// em vez de precisar lembrar de trocar em cada arquivo separado.

// --- Backend (api-hub na Vercel) ---
export const API_BASE_URL = 'https://kennowiski-api-hub.vercel.app';

export const API_ENDPOINTS = {
    letterboxd: `${API_BASE_URL}/api/letterboxd`,
    simkl: `${API_BASE_URL}/api/simkl`,
    spotify: `${API_BASE_URL}/api/spotify`,
    lastfm: `${API_BASE_URL}/api/lastfm`,
    gemini: `${API_BASE_URL}/api/gemini`,
    adminVerify: `${API_BASE_URL}/api/admin/verify`,
};

// --- Discord / Lanyard ---
export const DISCORD_USER_ID = '387025115898183702';
export const DISCORD_PROFILE_URL = `https://discord.com/users/${DISCORD_USER_ID}`;
export const LANYARD_API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;

// --- SIMKL ---
export const SIMKL_PROFILE_URL = 'https://simkl.com/8849020/';
export const SIMKL_HISTORY_URL = 'https://simkl.com/8849020/history/watch-history/';

// --- GitHub ---
export const GITHUB_USERNAME = 'kennowiski';
export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;

// --- Supabase (login do painel admin) ---
export const SUPABASE_PROJECT_URL = 'https://ivbpcyjkvzsawjzhrwsd.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YLo65P0_gWwgWTMhRzr7Cw_gnd03sdu';
export const SUPABASE_AUTH_STORAGE_KEY = 'sb-ivbpcyjkvzsawjzhrwsd-auth-token';
