// ==========================================
// PAINEL ADMIN (/admin)
// Antes vivia como <script> inline dentro de admin/index.html,
// fora do pipeline de build do TypeScript — o que já causou um
// bug real (esquecemos de atualizar essa página no rename
// trakt -> simkl, porque o tsc não a enxergava).
// Agora é compilado junto com o resto do site (dist/admin.js),
// então qualquer erro de referência aparece no build.
//
// Três partes, na mesma ordem/comportamento de antes:
// 1) Auth gate (Supabase) — libera o painel só pra admin autorizado
// 2) Dashboard de status das APIs + cache local
// 3) Debug detalhado das APIs (JSON, testar, copiar)
// ==========================================
// Faz este arquivo ser tratado como módulo ES (necessário para o
// `declare global` abaixo funcionar) — não muda nada em tempo de execução.
import { SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_AUTH_STORAGE_KEY, API_ENDPOINTS, LANYARD_API_URL, } from './config.js';
/* ADMIN_AUTH_GATE_V1 */
(() => {
    const ADMIN_VERIFY_ENDPOINT = API_ENDPOINTS.adminVerify;
    async function verifyAdminSessionWithBackend(session) {
        const accessToken = session && session.access_token;
        if (!accessToken)
            return false;
        try {
            const response = await fetch(ADMIN_VERIFY_ENDPOINT, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    authorization: 'Bearer ' + accessToken
                }
            });
            if (!response.ok)
                return false;
            const data = await response.json().catch(() => ({
                allowed: false
            }));
            return data && data.allowed === true;
        }
        catch (error) {
            console.error('Erro ao verificar admin no backend:', error);
            return false;
        }
    }
    function redirectToLogin() {
        window.location.replace('/login');
    }
    function loadSupabaseSdk() {
        return new Promise((resolve, reject) => {
            if (window.supabase && window.supabase.createClient) {
                resolve(window.supabase);
                return;
            }
            const existing = document.querySelector('script[data-admin-supabase-sdk="true"]');
            if (existing) {
                existing.addEventListener('load', () => resolve(window.supabase), { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.async = true;
            script.defer = true;
            script.dataset.adminSupabaseSdk = 'true';
            script.addEventListener('load', () => resolve(window.supabase), { once: true });
            script.addEventListener('error', reject, { once: true });
            document.head.appendChild(script);
        });
    }
    async function verifyAdminAccess() {
        try {
            const supabaseSdk = await loadSupabaseSdk();
            const client = supabaseSdk.createClient(SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY, {
                auth: {
                    storageKey: SUPABASE_AUTH_STORAGE_KEY,
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            window.kennyAdminSupabase = client;
            const sessionResult = await client.auth.getSession();
            const session = sessionResult && sessionResult.data ? sessionResult.data.session : null;
            if (!session) {
                redirectToLogin();
                return;
            }
            const userResult = await client.auth.getUser();
            const user = userResult && userResult.data ? userResult.data.user : null;
            const email = String((user && user.email) || (session.user && session.user.email) || '').toLowerCase();
            if (!(await verifyAdminSessionWithBackend(session))) {
                try {
                    await client.auth.signOut();
                }
                catch { }
                redirectToLogin();
                return;
            }
            const emailEl = document.getElementById('session-email');
            if (emailEl) {
                emailEl.textContent = 'Administrador autorizado';
            }
            window.KENNY_ADMIN_AUTH_ALLOWED = true;
            document.body.classList.remove('ka-auth-checking');
            document.body.classList.add('ka-auth-ok');
            window.dispatchEvent(new Event('kenny-admin-auth-ready'));
        }
        catch (error) {
            console.error('Erro ao verificar acesso ao admin:', error);
            redirectToLogin();
        }
    }
    verifyAdminAccess();
})();
/* FIM ADMIN_AUTH_GATE_V1 */
const ENDPOINTS = [
    {
        key: 'discord',
        name: 'Discord',
        url: LANYARD_API_URL,
        format(data) {
            const status = data && data.data ? data.data.discord_status : 'offline';
            return {
                title: status,
                detail: 'Status público via Lanyard.'
            };
        }
    },
    {
        key: 'spotify',
        name: 'Spotify / Last.fm',
        url: API_ENDPOINTS.spotify,
        format(data) {
            return {
                title: data && data.title ? data.title : 'Sem música',
                detail: data && data.artist ? data.artist : 'Nenhum artista agora'
            };
        }
    },
    {
        key: 'letterboxd',
        name: 'Letterboxd',
        url: API_ENDPOINTS.letterboxd,
        format(data) {
            return {
                title: data && data.title ? data.title : 'Sem filme',
                detail: data && data.rating ? 'Nota: ' + data.rating : 'Último filme visto.'
            };
        }
    },
    {
        key: 'simkl',
        name: 'Simkl',
        url: API_ENDPOINTS.simkl,
        format(data) {
            const season = String((data && data.season) || 0).padStart(2, '0');
            const episode = String((data && data.episodeNumber) || 0).padStart(2, '0');
            return {
                title: data && data.show ? data.show : 'Sem série',
                detail: data && data.episode ? 'S' + season + 'E' + episode + ' — ' + data.episode : 'Último episódio visto.'
            };
        }
    },
    {
        key: 'lastfm',
        name: 'Last.fm',
        url: API_ENDPOINTS.lastfm + '?limit=1',
        format(data) {
            const track = Array.isArray(data) ? data[0] :
                data && Array.isArray(data.tracks) ? data.tracks[0] :
                    data && data.recenttracks && Array.isArray(data.recenttracks.track) ? data.recenttracks.track[0] :
                        null;
            return {
                title: track && (track.title || track.name) ? (track.title || track.name) : 'Histórico',
                detail: track && track.artist ? String(track.artist.name || track.artist) : 'Consulta de histórico recente.'
            };
        }
    }
];
const resultsByKey = new Map();
function qs(selector) {
    return document.querySelector(selector);
}
function setActiveNav() {
    const links = Array.from(document.querySelectorAll('.ka-nav a'));
    const sections = links
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);
    let active = sections[0];
    for (const section of sections) {
        if (section.getBoundingClientRect().top <= 120) {
            active = section;
        }
    }
    links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + active.id);
    });
}
async function checkService(service) {
    const startedAt = performance.now();
    try {
        const response = await fetch(service.url, { cache: 'no-store' });
        const ms = Math.round(performance.now() - startedAt);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        const data = await response.json();
        const formatted = service.format(data);
        return {
            ok: true,
            ms,
            title: formatted.title,
            detail: formatted.detail
        };
    }
    catch (error) {
        return {
            ok: false,
            ms: Math.round(performance.now() - startedAt),
            title: 'Indisponível',
            detail: error && error.message ? error.message : 'Erro ao consultar.'
        };
    }
}
function renderApiCard(service, result, loading = false) {
    const grid = qs('#api-grid');
    let card = grid.querySelector(`[data-api="${service.key}"]`);
    if (!card) {
        card = document.createElement('article');
        card.className = 'ka-api-card';
        card.dataset.api = service.key;
        grid.appendChild(card);
    }
    card.classList.toggle('online', Boolean(result && result.ok));
    card.innerHTML = `
                <div class="ka-api-top">
                    <span class="ka-dot"></span>
                    <span class="ka-api-name">${service.name}</span>
                    <button class="ka-btn ka-btn-small" data-refresh-api="${service.key}" type="button" ${loading ? 'disabled' : ''}>
                        ${loading ? 'Atualizando...' : 'Atualizar'}
                    </button>
                </div>
                <div class="ka-api-title">${loading ? 'Verificando...' : (result?.title || '--')}</div>
                <p>${loading ? 'Fazendo nova requisição.' : (result?.detail || '--')}</p>
                <small>${result?.ms ? result.ms + 'ms' : ''}</small>
            `;
}
function renderSummary() {
    const results = ENDPOINTS.map((service) => resultsByKey.get(service.key)).filter(Boolean);
    const online = results.filter((result) => result.ok).length;
    const total = ENDPOINTS.length;
    const avg = results.length ? Math.round(results.reduce((sum, result) => sum + result.ms, 0) / results.length) : 0;
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const status = online === total ? 'Tudo online' : online > 0 ? 'Parcial' : 'Fora do ar';
    qs('#summary-grid').innerHTML = `
                <article class="ka-mini-card">
                    <span class="ka-mini-label">APIs online</span>
                    <strong class="ka-mini-value">${online}/${total}</strong>
                    <p>Serviços respondendo agora.</p>
                </article>
                <article class="ka-mini-card">
                    <span class="ka-mini-label">Última atualização</span>
                    <strong class="ka-mini-value">${now}</strong>
                    <p>Horário local do navegador.</p>
                </article>
                <article class="ka-mini-card">
                    <span class="ka-mini-label">Tempo médio</span>
                    <strong class="ka-mini-value">${avg}ms</strong>
                    <p>Média das respostas testadas.</p>
                </article>
                <article class="ka-mini-card">
                    <span class="ka-mini-label">Status geral</span>
                    <strong class="ka-mini-value">${status}</strong>
                    <p>${online} de ${total} serviços online.</p>
                </article>
            `;
}
function renderCache() {
    const list = qs('#cache-list');
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key)
            continue;
        const lower = key.toLowerCase();
        if (!lower.includes('letterboxd') && !lower.includes('simkl'))
            continue;
        let label = lower.includes('letterboxd') ? 'Letterboxd' : 'Simkl';
        let value = 'Cache salvo';
        try {
            const parsed = JSON.parse(localStorage.getItem(key));
            const data = parsed.data || parsed.value || parsed;
            value = data.title || data.name || data.show || value;
        }
        catch { }
        items.push({ key, label, value });
    }
    if (!items.length) {
        list.innerHTML = `
                    <article class="ka-cache-row">
                        <div>
                            <strong>Cache local</strong>
                            <p class="ka-muted">Nenhum cache encontrado nesta origem do navegador ainda.</p>
                        </div>
                    </article>
                `;
        return;
    }
    list.innerHTML = items.map((item) => `
                <article class="ka-cache-row">
                    <div>
                        <strong>${item.label}</strong>
                        <p class="ka-muted">${item.value}</p>
                    </div>
                    <button class="ka-btn ka-btn-small" data-clear-cache="${item.key}" type="button">Limpar</button>
                </article>
            `).join('');
}
async function refreshApi(key) {
    const service = ENDPOINTS.find((item) => item.key === key);
    if (!service)
        return;
    renderApiCard(service, resultsByKey.get(key), true);
    const result = await checkService(service);
    resultsByKey.set(key, result);
    renderApiCard(service, result);
    renderSummary();
    renderCache();
}
async function refreshAll() {
    qs('#refresh-all').disabled = true;
    qs('#refresh-all').textContent = 'Atualizando...';
    ENDPOINTS.forEach((service) => renderApiCard(service, null, true));
    await Promise.all(ENDPOINTS.map((service) => refreshApi(service.key)));
    qs('#refresh-all').disabled = false;
    qs('#refresh-all').textContent = 'Atualizar tudo';
}
async function logout() {
    const button = qs('#logout-btn');
    const oldText = button ? button.textContent : '';
    if (button) {
        button.disabled = true;
        button.textContent = 'Saindo...';
    }
    try {
        if (window.kennyAdminSupabase) {
            await window.kennyAdminSupabase.auth.signOut();
        }
    }
    catch (error) {
        console.warn('Erro ao sair pelo Supabase:', error);
    }
    const localKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key)
            continue;
        const lower = key.toLowerCase();
        if (lower.startsWith('sb-') || lower.includes('supabase') || lower.includes('auth-token')) {
            localKeys.push(key);
        }
    }
    localKeys.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
    window.location.href = '/';
}
document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element))
        return;
    const refreshApiButton = event.target.closest('[data-refresh-api]');
    if (refreshApiButton) {
        refreshApi(refreshApiButton.dataset.refreshApi || '');
        return;
    }
    const clearCacheButton = event.target.closest('[data-clear-cache]');
    if (clearCacheButton) {
        localStorage.removeItem(clearCacheButton.dataset.clearCache || '');
        renderCache();
        return;
    }
});
qs('#refresh-all').addEventListener('click', refreshAll);
qs('#logout-btn').addEventListener('click', logout);
window.addEventListener('scroll', setActiveNav, { passive: true });
window.addEventListener('resize', setActiveNav);
function initAdminAfterAuth() {
    renderCache();
    refreshAll();
    setActiveNav();
}
if (window.KENNY_ADMIN_AUTH_ALLOWED) {
    initAdminAfterAuth();
}
else {
    window.addEventListener('kenny-admin-auth-ready', initAdminAfterAuth, { once: true });
}
(function () {
    const DEBUG_APIS = {
        spotify: {
            name: 'Spotify',
            url: API_ENDPOINTS.spotify
        },
        lastfm: {
            name: 'Last.fm',
            url: API_ENDPOINTS.lastfm + '?limit=1'
        },
        letterboxd: {
            name: 'Letterboxd',
            url: API_ENDPOINTS.letterboxd
        },
        simkl: {
            name: 'Simkl',
            url: API_ENDPOINTS.simkl
        },
        discord: {
            name: 'Discord / Lanyard',
            url: LANYARD_API_URL
        }
    };
    const SENSITIVE_KEYS = [
        'access_token',
        'refresh_token',
        'authorization',
        'client_secret',
        'client_id',
        'password',
        'email',
        'token',
        'secret',
        'api_key',
        'apikey',
        'key'
    ];
    const debugState = {};
    function getDebugElements(key) {
        return {
            card: document.querySelector('[data-debug-card="' + key + '"]'),
            status: document.querySelector('[data-debug-status="' + key + '"]'),
            http: document.querySelector('[data-debug-http="' + key + '"]'),
            time: document.querySelector('[data-debug-time="' + key + '"]'),
            updated: document.querySelector('[data-debug-updated="' + key + '"]'),
            json: document.querySelector('[data-debug-json="' + key + '"]'),
            copy: document.querySelector('[data-debug-copy="' + key + '"]'),
            run: document.querySelector('[data-debug-run="' + key + '"]')
        };
    }
    function nowLabel() {
        return new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    function isSensitiveKey(key) {
        const normalized = String(key || '').toLowerCase();
        return SENSITIVE_KEYS.some(function (sensitive) {
            return normalized.includes(sensitive);
        });
    }
    function maskSensitiveData(value, parentKey) {
        if (isSensitiveKey(parentKey)) {
            return '[oculto]';
        }
        if (Array.isArray(value)) {
            return value.map(function (item) {
                return maskSensitiveData(item, parentKey);
            });
        }
        if (value && typeof value === 'object') {
            const output = {};
            Object.keys(value).forEach(function (key) {
                output[key] = maskSensitiveData(value[key], key);
            });
            return output;
        }
        return value;
    }
    function stringifyDebugPayload(payload) {
        try {
            return JSON.stringify(maskSensitiveData(payload), null, 2);
        }
        catch (error) {
            return String(payload);
        }
    }
    function escapeDebugHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    function syntaxHighlightJson(json) {
        const escaped = escapeDebugHtml(json);
        return escaped
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}\[\],:])/g, function (match) {
            let className = 'ka-json-number';
            if (/^"/.test(match)) {
                className = /:$/.test(match) ? 'ka-json-key' : 'ka-json-string';
            }
            else if (/true|false/.test(match)) {
                className = 'ka-json-boolean';
            }
            else if (/null/.test(match)) {
                className = 'ka-json-null';
            }
            else if (/^[{}\[\],:]$/.test(match)) {
                className = 'ka-json-punctuation';
            }
            return '<span class="' + className + '">' + match + '</span>';
        });
    }
    function renderDebugJson(element, payload) {
        if (!element)
            return;
        element.innerHTML = syntaxHighlightJson(stringifyDebugPayload(payload));
    }
    function setCardState(key, state) {
        const elements = getDebugElements(key);
        if (!elements.card)
            return;
        elements.card.dataset.status = state;
    }
    function setText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }
    function setLoading(key) {
        const elements = getDebugElements(key);
        setCardState(key, 'loading');
        setText(elements.status, 'Testando...');
        setText(elements.http, '—');
        setText(elements.time, '—');
        setText(elements.updated, nowLabel());
        if (elements.run) {
            elements.run.disabled = true;
            elements.run.textContent = 'Testando...';
        }
        if (elements.copy) {
            elements.copy.disabled = true;
        }
    }
    function setDone(key, result) {
        const elements = getDebugElements(key);
        const ok = result.ok === true;
        setCardState(key, ok ? 'ok' : 'error');
        setText(elements.status, ok ? 'Online' : 'Erro');
        setText(elements.http, result.httpStatus ? String(result.httpStatus) : '—');
        setText(elements.time, result.durationMs + 'ms');
        setText(elements.updated, nowLabel());
        if (elements.json) {
            renderDebugJson(elements.json, result.payload);
        }
        if (elements.copy) {
            elements.copy.disabled = false;
        }
        if (elements.run) {
            elements.run.disabled = false;
            elements.run.textContent = 'Testar';
        }
        debugState[key] = result;
    }
    function setFailedBeforeResponse(key, error, durationMs) {
        const elements = getDebugElements(key);
        const payload = {
            ok: false,
            error: error && error.name === 'AbortError'
                ? 'Tempo limite excedido'
                : error && error.message
                    ? error.message
                    : 'Erro desconhecido'
        };
        setCardState(key, 'error');
        setText(elements.status, 'Erro');
        setText(elements.http, '—');
        setText(elements.time, durationMs + 'ms');
        setText(elements.updated, nowLabel());
        if (elements.json) {
            renderDebugJson(elements.json, payload);
        }
        if (elements.copy) {
            elements.copy.disabled = false;
        }
        if (elements.run) {
            elements.run.disabled = false;
            elements.run.textContent = 'Testar';
        }
        debugState[key] = {
            ok: false,
            httpStatus: null,
            durationMs,
            payload
        };
    }
    async function readResponsePayload(response) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return response.json();
        }
        const text = await response.text();
        try {
            return JSON.parse(text);
        }
        catch (error) {
            return {
                raw: text
            };
        }
    }
    async function runDebug(key) {
        const config = DEBUG_APIS[key];
        if (!config)
            return;
        const startedAt = performance.now();
        const controller = new AbortController();
        const timeout = window.setTimeout(function () {
            controller.abort();
        }, 15000);
        setLoading(key);
        try {
            const response = await fetch(config.url, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal,
                headers: {
                    accept: 'application/json, text/plain, */*'
                }
            });
            const payload = await readResponsePayload(response);
            const durationMs = Math.round(performance.now() - startedAt);
            setDone(key, {
                ok: response.ok,
                api: config.name,
                url: config.url,
                httpStatus: response.status,
                statusText: response.statusText,
                durationMs,
                checkedAt: new Date().toISOString(),
                payload
            });
        }
        catch (error) {
            const durationMs = Math.round(performance.now() - startedAt);
            setFailedBeforeResponse(key, error, durationMs);
        }
        finally {
            window.clearTimeout(timeout);
        }
    }
    function toggleJson(key) {
        const elements = getDebugElements(key);
        if (!elements.card)
            return;
        elements.card.classList.toggle('is-open');
    }
    async function copyJson(key) {
        const elements = getDebugElements(key);
        if (!elements.json)
            return;
        const text = elements.json.textContent || '';
        try {
            await navigator.clipboard.writeText(text);
            if (elements.copy) {
                const oldText = elements.copy.textContent;
                elements.copy.textContent = 'Copiado';
                window.setTimeout(function () {
                    elements.copy.textContent = oldText || 'Copiar JSON';
                }, 1200);
            }
        }
        catch (error) {
            alert('Não foi possível copiar automaticamente. Selecione o JSON manualmente.');
        }
    }
    function collapseAllJson() {
        document.querySelectorAll('[data-debug-card]').forEach(function (card) {
            card.classList.remove('is-open');
        });
    }
    function bindDebugEvents() {
        document.addEventListener('click', function (event) {
            const target = event.target;
            if (!(target instanceof Element))
                return;
            const runButton = target.closest('[data-debug-run]');
            const toggleButton = target.closest('[data-debug-toggle]');
            const copyButton = target.closest('[data-debug-copy]');
            if (runButton) {
                event.preventDefault();
                runDebug(runButton.getAttribute('data-debug-run'));
                return;
            }
            if (toggleButton) {
                event.preventDefault();
                toggleJson(toggleButton.getAttribute('data-debug-toggle'));
                return;
            }
            if (copyButton) {
                event.preventDefault();
                copyJson(copyButton.getAttribute('data-debug-copy'));
            }
        });
        const runAllButton = document.getElementById('ka-debug-run-all');
        if (runAllButton) {
            runAllButton.addEventListener('click', async function () {
                runAllButton.disabled = true;
                runAllButton.textContent = 'Testando...';
                for (const key of Object.keys(DEBUG_APIS)) {
                    await runDebug(key);
                }
                runAllButton.disabled = false;
                runAllButton.textContent = 'Testar todas';
            });
        }
        const collapseAllButton = document.getElementById('ka-debug-collapse-all');
        if (collapseAllButton) {
            collapseAllButton.addEventListener('click', collapseAllJson);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindDebugEvents);
    }
    else {
        bindDebugEvents();
    }
})();
