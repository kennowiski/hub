// ==========================================
// AUTENTICAÇÃO (SUPABASE) + PAINEL ADMIN
// Controla o login usado para liberar o botão de gerar
// story do Simkl (acesso restrito ao admin).
// ==========================================

// O SDK do Supabase é carregado dinamicamente via <script> (loadSupabaseSdk),
// então o TypeScript não o conhece estaticamente — declaramos aqui como `any`.
declare global {
    interface Window {
        supabase?: {
            createClient: (url: string, key: string, options?: any) => any;
        };
    }
}

/* Supabase Auth Gate - botão Story Simkl */
const SUPABASE_PROJECT_URL = 'https://ivbpcyjkvzsawjzhrwsd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YLo65P0_gWwgWTMhRzr7Cw_gnd03sdu';
const ADMIN_VERIFY_ENDPOINT = 'https://kennowiski-api-hub.vercel.app/api/admin/verify';


/* ADMIN_VERIFY_HELPER_V1 */
async function verifyAdminSessionWithBackend(client: any, authData?: any): Promise<boolean> {
    let accessToken = authData &&
        authData.session &&
        authData.session.access_token;

    if (!accessToken && authData && authData.access_token) {
        accessToken = authData.access_token;
    }

    if (!accessToken && client && client.auth && typeof client.auth.getSession === 'function') {
        const sessionResult = await client.auth.getSession();
        accessToken = sessionResult &&
            sessionResult.data &&
            sessionResult.data.session &&
            sessionResult.data.session.access_token;
    }

    if (!accessToken) return false;

    try {
        const response = await fetch(ADMIN_VERIFY_ENDPOINT, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                authorization: 'Bearer ' + accessToken
            }
        });

        if (!response.ok) return false;

        const data = await response.json().catch(() => ({
            allowed: false
        }));

        return data && data.allowed === true;
    } catch (error) {
        console.error('Erro ao verificar admin:', error);
        return false;
    }
}
/* FIM ADMIN_VERIFY_HELPER_V1 */

const SUPABASE_AUTH_STORAGE_KEY = 'sb-ivbpcyjkvzsawjzhrwsd-auth-token';

function hasSupabaseSessionStored() {
    try {
        return Boolean(localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY));
    } catch {
        return false;
    }
}

function loadSupabaseSdk(): Promise<NonNullable<Window['supabase']>> {
    return new Promise((resolve, reject) => {
        if (window.supabase && window.supabase.createClient) {
            resolve(window.supabase);
            return;
        }

        const existingScript = document.querySelector('script[data-supabase-sdk="true"]');

        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.supabase), { once: true });
            existingScript.addEventListener('error', reject, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        script.defer = true;
        script.dataset.supabaseSdk = 'true';

        script.onload = () => resolve(window.supabase);
        script.onerror = () => reject(new Error('Não foi possível carregar o Supabase Auth.'));

        document.head.appendChild(script);
    });
}

async function getSupabaseAuthClient() {
    const supabaseGlobal = await loadSupabaseSdk();

    return supabaseGlobal.createClient(
        SUPABASE_PROJECT_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        }
    );
}

function showSimklStoryButton() {
    document.documentElement.classList.add('supabase-story-authorized');
}

function hideSimklStoryButton() {
    document.documentElement.classList.remove('supabase-story-authorized');
}

function setStoryLoginMessage(message, type = '') {
    const messageEl = document.getElementById('story-login-message');

    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.classList.remove('error', 'success');

    if (type) {
        messageEl.classList.add(type);
    }
}

function cleanSupabaseAuthUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('login');
    url.searchParams.delete('logout');

    const cleanPath = url.pathname.replace(/\/+$/, '') === '/login' ? '/' : url.pathname;

    window.history.replaceState(
        {},
        document.title,
        cleanPath + (url.search ? url.search : '') + url.hash
    );
}


/* STORY_LOGIN_SCROLL_LOCK_V1 */
let storyLoginSavedScrollY = 0;
let storyLoginScrollLocked = false;

function lockStoryLoginScroll() {
    if (storyLoginScrollLocked) return;

    storyLoginSavedScrollY = window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

    storyLoginScrollLocked = true;

    document.documentElement.classList.add('story-login-scroll-locked');
    document.body.classList.add('story-login-scroll-locked');

    document.body.style.position = 'fixed';
    document.body.style.top = '-' + storyLoginSavedScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
}

function unlockStoryLoginScroll() {
    if (!storyLoginScrollLocked) return;

    storyLoginScrollLocked = false;

    document.documentElement.classList.remove('story-login-scroll-locked');
    document.body.classList.remove('story-login-scroll-locked');

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';

    window.scrollTo(0, storyLoginSavedScrollY);
}
/* FIM STORY_LOGIN_SCROLL_LOCK_V1 */

function closeStoryLoginModal() {
    const modal = document.getElementById('story-login-modal');

    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }

    unlockStoryLoginScroll();
}

function openStoryLoginModal(client) {
    return new Promise((resolve) => {
        const modal = document.getElementById('story-login-modal');
        const form = document.getElementById('story-login-form');
        const emailInput = document.getElementById('story-login-email') as HTMLInputElement | null;
        const passwordInput = document.getElementById('story-login-password') as HTMLInputElement | null;
        const closeBtn = document.getElementById('story-login-close');
        const submitBtn = document.getElementById('story-login-submit') as HTMLButtonElement | null;

        if (!modal || !form || !emailInput || !passwordInput || !submitBtn) {
            resolve(false);
            return;
        }

        emailInput.value = '';
        passwordInput.value = '';
        setStoryLoginMessage('');

        modal.classList.add('active');
        lockStoryLoginScroll();
        modal.setAttribute('aria-hidden', 'false');


        const cleanup = () => {
            form.removeEventListener('submit', handleSubmit);
            closeBtn?.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleOverlayClick);
            document.removeEventListener('keydown', handleEscape);
        };

        const finish = (result) => {
            cleanup();
            closeStoryLoginModal();
            resolve(result);
        };

        const handleCancel = () => {
            const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';

            if (normalizedPath === '/login') {
                document.documentElement.classList.add('auth-redirecting');
                window.location.replace('/');
                return;
            }

            cleanSupabaseAuthUrl();
            finish(false);
        };

        const handleOverlayClick = (event) => {
            if (event.target === modal) {
                handleCancel();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                handleCancel();
            }
        };

        async function handleSubmit(event) {
            event.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                setStoryLoginMessage('Preencha e-mail e senha.', 'error');
                return;
            }

            submitBtn.disabled = true;
            setStoryLoginMessage('Entrando...');

            try {
                const { data, error } = await client.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    setStoryLoginMessage('Login inválido.', 'error');
                    passwordInput.value = '';
                    passwordInput.focus();
                    return;
                }

                const loggedEmail = data && data.user && data.user.email
                    ? data.user.email.toLowerCase()
                    : '';

                if (!(await verifyAdminSessionWithBackend(client, data))) {
                    await client.auth.signOut();
                    hideSimklStoryButton();
                    setStoryLoginMessage('Usuário não autorizado.', 'error');
                    return;
                }

                showSimklStoryButton();
                cleanSupabaseAuthUrl();
                setStoryLoginMessage('Acesso liberado.', 'success');

                setTimeout(() => {
                    finish(true);
                }, 350);
            } catch (error) {
                console.error('Erro no login do Supabase:', error);
                setStoryLoginMessage('Erro ao entrar. Tente novamente.', 'error');
            } finally {
                submitBtn.disabled = false;
            }
        }

        form.addEventListener('submit', handleSubmit);
        closeBtn?.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleOverlayClick);
        document.addEventListener('keydown', handleEscape);
    });
}

async function handleSupabaseStoryAuth() {
    const params = new URLSearchParams(window.location.search);
    const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
    const wantsLogin = normalizedPath === '/login';
    const wantsLogout = params.get('logout') === 'on';

    if (!wantsLogin && !wantsLogout && !hasSupabaseSessionStored()) {
        hideSimklStoryButton();
        return;
    }

    try {
        const client = await getSupabaseAuthClient();

        if (wantsLogout) {
            await client.auth.signOut();
            hideSimklStoryButton();
            cleanSupabaseAuthUrl();
            return;
        }

        if (wantsLogin) {
            const didLogin = await openStoryLoginModal(client);

            if (didLogin) {
                window.location.href = '/admin';
            }
            return;
        }

        const { data, error } = await client.auth.getUser();

        if (error || !data || !data.user || !data.user.email) {
            hideSimklStoryButton();
            return;
        }

        if (await verifyAdminSessionWithBackend(client, data)) {
            showSimklStoryButton();
        } else {
            hideSimklStoryButton();
        }
    } catch (error) {
        console.error('Erro no Supabase Auth:', error);
        hideSimklStoryButton();
    }
}

/* Fim Supabase Auth Gate - botão Story Simkl */

export function initAdmin() {
    handleSupabaseStoryAuth();
}
