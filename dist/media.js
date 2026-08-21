// MÍDIA: LETTERBOXD + SIMKL + RECOMENDAÇÕES GEMINI
// Estas três seções foram mantidas juntas porque compartilham
// funções de cache, renderização de estrelas e chamam funções
// umas das outras (ex: os modais do Letterboxd/Simkl disparam
// as recomendações do Gemini).
import { setImageSrcIfChanged } from './utils.js';
import { closeSpotifyHistoryModalIfOpen } from './spotify.js';
import { API_ENDPOINTS, SIMKL_HISTORY_URL } from './config.js';
export function initMedia() {
    // Referência local ao modal de tecnologias (definido em main.ts),
    // usada apenas pelo atalho de teclado Esc mais abaixo.
    const techModal = document.getElementById('mobile-tech-modal');
    // FUNÇÕES GERAIS DE COMPARTILHAMENTO
    function renderSimklStars(rating) {
        const numericRating = Number(rating);
        if (!Number.isFinite(numericRating) || numericRating <= 0)
            return '';
        const starsOutOfFive = numericRating / 2;
        const fullStars = Math.floor(starsOutOfFive);
        const hasHalfStar = starsOutOfFive % 1 >= 0.5;
        return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '');
    }
    function renderLetterboxdStars(rating) {
        if (rating === null || rating === undefined || rating === '')
            return '';
        const ratingText = String(rating).trim();
        if (!ratingText)
            return '';
        if (/[★☆½]/.test(ratingText)) {
            return ratingText.replace(/☆/g, '').replace(/[^★½]/g, '').trim();
        }
        const numericMatch = ratingText.match(/\d+(?:[\.,]\d+)?/);
        if (!numericMatch)
            return '';
        let numericRating = Number(numericMatch[0].replace(',', '.'));
        if (!Number.isFinite(numericRating) || numericRating <= 0)
            return '';
        if (numericRating > 5) {
            numericRating = numericRating / 2;
        }
        const fullStars = Math.floor(numericRating);
        const hasHalfStar = numericRating - fullStars >= 0.25;
        return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '');
    }
    function splitLetterboxdTitleAndRating(rawTitle) {
        const titleText = String(rawTitle || '').trim();
        if (!titleText) {
            return { title: '', rating: '' };
        }
        const titleRatingMatch = titleText.match(/^(.*?)(?:\s*[-–—:|•·]\s*)?([★☆½\s]+)\s*$/);
        const hasStarsAtEnd = titleRatingMatch && /[★½☆]/.test(titleRatingMatch[2]);
        if (!hasStarsAtEnd) {
            return { title: titleText, rating: '' };
        }
        return {
            title: titleRatingMatch[1].trim() || titleText.replace(/[★☆½\s]+$/, '').trim(),
            rating: renderLetterboxdStars(titleRatingMatch[2])
        };
    }
    function normalizeLetterboxdData(data) {
        const splitTitle = splitLetterboxdTitleAndRating(data?.title);
        const rating = renderLetterboxdStars(data?.rating) ||
            renderLetterboxdStars(data?.stars) ||
            renderLetterboxdStars(data?.score) ||
            splitTitle.rating;
        return {
            ...data,
            title: splitTitle.title || 'Filme não encontrado',
            rating
        };
    }
    let currentMovieRecommendationTarget = null;
    let currentSeriesRecommendationTarget = null;
    // Cache Letterboxd e Simkl
    const LETTERBOXD_CACHE_KEY = 'kenny-letterboxd-last-movie';
    const LETTERBOXD_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 horas
    const SIMKL_CACHE_KEY = 'kenny-simkl-last-episode';
    const SIMKL_CACHE_TTL_MS = 1000 * 60 * 90; // 1h30min
    function readTimedMediaCache(key, ttlMs) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw)
                return null;
            const cached = JSON.parse(raw);
            if (!cached || typeof cached.createdAt !== 'number' || !cached.data) {
                localStorage.removeItem(key);
                return null;
            }
            if (Date.now() - cached.createdAt > ttlMs) {
                localStorage.removeItem(key);
                return null;
            }
            return cached.data;
        }
        catch (error) {
            console.warn('Cache local indisponível:', key, error);
            return null;
        }
    }
    function writeTimedMediaCache(key, data) {
        try {
            if (!data)
                return;
            localStorage.setItem(key, JSON.stringify({
                createdAt: Date.now(),
                data
            }));
        }
        catch (error) {
            console.warn('Não foi possível salvar cache local:', key, error);
        }
    }
    function isValidLetterboxdData(data) {
        return Boolean(data && data.title);
    }
    function isValidSimklData(data) {
        return Boolean(data && !data.error && (data.show || data.episode));
    }
    function renderLetterboxdData(data) {
        if (!isValidLetterboxdData(data))
            return false;
        const posterImg = document.getElementById('lb-poster');
        const titleSpan = document.getElementById('lb-title');
        const ratingSpan = document.getElementById('lb-rating-card');
        const safeFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='72' viewBox='0 0 48 72'%3E%3Crect width='48' height='72' rx='6' fill='%2314161e'/%3E%3Ctext x='24' y='38' text-anchor='middle' fill='%2394a3b8' font-family='Arial' font-size='8'%3EFilme%3C/text%3E%3C/svg%3E";
        if (posterImg) {
            posterImg.onerror = function () { this.src = safeFallback; };
            setImageSrcIfChanged(posterImg, data.poster || safeFallback);
        }
        const normalizedData = normalizeLetterboxdData(data);
        if (titleSpan)
            titleSpan.textContent = normalizedData.title;
        if (ratingSpan)
            ratingSpan.textContent = normalizedData.rating;
        updateLbModal(normalizedData);
        return true;
    }
    function renderSimklData(data) {
        if (!isValidSimklData(data))
            return false;
        const posterImg = document.getElementById('simkl-poster');
        const titleSpan = document.getElementById('simkl-title');
        const episodeSpan = document.getElementById('simkl-episode');
        const ratingSpan = document.getElementById('simkl-rating');
        if (titleSpan)
            titleSpan.textContent = data.show || 'Série não encontrada';
        if (episodeSpan) {
            const season = String(data.season || 0).padStart(2, '0');
            const episode = String(data.episodeNumber || 0).padStart(2, '0');
            episodeSpan.textContent = `S${season}E${episode} — ${data.episode || 'Episódio'}`;
        }
        if (ratingSpan)
            ratingSpan.textContent = renderSimklStars(data.rating);
        if (posterImg) {
            const safeFallback = 'https://placehold.co/48x72/14161e/94a3b8?text=TV';
            posterImg.onerror = function () { this.src = safeFallback; };
            setImageSrcIfChanged(posterImg, data.poster || safeFallback);
        }
        currentSimklStoryData = data;
        updateSimklModal(data);
        return true;
    }
    // LETTERBOXD 
    function updateLbModal(data) {
        const safeFallback = 'https://placehold.co/300x450/14161e/94a3b8?text=Filme';
        const poster = data.poster || safeFallback;
        const modalPoster = document.getElementById('lb-modal-poster');
        const modalBg = document.getElementById('lb-modal-bg');
        const modalTitle = document.getElementById('lb-modal-title');
        const modalRating = document.getElementById('lb-modal-rating');
        const openLink = document.getElementById('lb-open-link');
        if (modalPoster) {
            modalPoster.onerror = function () { this.src = safeFallback; };
            setImageSrcIfChanged(modalPoster, poster);
        }
        if (modalBg)
            modalBg.style.backgroundImage = `url('${poster}')`;
        const normalizedData = normalizeLetterboxdData(data);
        currentMovieRecommendationTarget = {
            type: 'movie',
            title: normalizedData.title || 'Filme não encontrado',
            year: data.year || data.releaseYear || '',
            extra: normalizedData.rating ? `Avaliação: ${normalizedData.rating}` : ''
        };
        resetGeminiRecommendation('lb');
        if (modalTitle)
            modalTitle.textContent = normalizedData.title || 'Filme não encontrado';
        if (modalRating)
            modalRating.textContent = normalizedData.rating;
        if (openLink)
            openLink.href = data.link || 'https://letterboxd.com/kennowiski/';
    }
    async function fetchLetterboxd() {
        const cachedData = readTimedMediaCache(LETTERBOXD_CACHE_KEY, LETTERBOXD_CACHE_TTL_MS);
        if (cachedData) {
            renderLetterboxdData(cachedData);
        }
        try {
            const response = await fetch(API_ENDPOINTS.letterboxd);
            if (!response.ok) {
                throw new Error('Resposta inválida da API do Letterboxd.');
            }
            const data = await response.json();
            if (!isValidLetterboxdData(data))
                return;
            if (renderLetterboxdData(data)) {
                writeTimedMediaCache(LETTERBOXD_CACHE_KEY, data);
            }
        }
        catch (error) {
            console.error('Erro no Letterboxd:', error);
        }
    }
    fetchLetterboxd();
    const lbCard = document.getElementById('lb-card');
    const lbModal = document.getElementById('lb-modal');
    const closeLbModalBtn = document.getElementById('close-lb-modal');
    function openLbModal() {
        lbModal.classList.add('active');
        lbModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    function closeLbModalFn() {
        lbModal.classList.remove('active');
        lbModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
    if (lbCard && lbModal) {
        lbCard.addEventListener('click', openLbModal);
        lbCard.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLbModal();
        } });
    }
    if (closeLbModalBtn)
        closeLbModalBtn.addEventListener('click', closeLbModalFn);
    if (lbModal)
        lbModal.addEventListener('click', (e) => { if (e.target === lbModal)
            closeLbModalFn(); });
    // SIMKL 
    const SIMKL_STORY_AVATAR_URL = 'assets/images/simkl-story-avatar.webp';
    let currentSimklStoryData = null;
    function getSimklStoryButtonHtml() {
        return `
        <svg aria-hidden="true" class="icon" viewbox="0 0 512 512">
            <path d="M352 224c53 0 96-43 96-96s-43-96-96-96s-96 43-96 96c0 4 .2 8 .7 11.9L160.6 188C143 171.7 119.5 162 94 162c-53 0-96 43-96 96s43 96 96 96c25.5 0 49-9.7 66.6-26l96.1 48.1c-.5 3.9-.7 7.9-.7 11.9c0 53 43 96 96 96s96-43 96-96s-43-96-96-96c-25.5 0-49 9.7-66.6 26l-96.1-48.1c.5-3.9 .7-7.9 .7-11.9s-.2-8-.7-11.9l96.1-48.1c17.6 16.3 41.1 26 66.6 26z"></path>
        </svg>
    `;
    }
    function getCanvasImageCandidateSources(src) {
        const original = String(src || '').trim();
        const candidates = [];
        const addCandidate = (value) => {
            if (value && !candidates.includes(value)) {
                candidates.push(value);
            }
        };
        if (!original)
            return candidates;
        addCandidate(original);
        try {
            const url = new URL(original, window.location.href);
            if (url.hostname === 'image.tmdb.org') {
                const higherQuality = url.href.replace('/t/p/w300/', '/t/p/w780/');
                const withoutProtocol = higherQuality.replace(/^https?:\/\//, '');
                addCandidate(higherQuality);
                addCandidate('https://images.weserv.nl/?url=' + encodeURIComponent(withoutProtocol));
                addCandidate('https://wsrv.nl/?url=' + encodeURIComponent(withoutProtocol));
                addCandidate('https://images.weserv.nl/?url=' + encodeURIComponent(higherQuality));
            }
        }
        catch { }
        return candidates;
    }
    function loadSingleCanvasImage(src) {
        return new Promise((resolve, reject) => {
            if (!src) {
                reject(new Error('Imagem não informada.'));
                return;
            }
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.referrerPolicy = 'no-referrer';
            img.decoding = 'async';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Não foi possível carregar a imagem: ' + src));
            img.src = src;
        });
    }
    async function loadCanvasImage(src) {
        const sources = getCanvasImageCandidateSources(src);
        let lastError = null;
        for (const source of sources) {
            try {
                return await loadSingleCanvasImage(source);
            }
            catch (error) {
                lastError = error;
                console.warn('Falha ao carregar imagem do canvas, tentando fallback:', source, error);
            }
        }
        throw lastError || new Error('Não foi possível carregar a imagem: ' + src);
    }
    function roundRectPath(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    function drawCoverImage(ctx, img, x, y, width, height, radius) {
        const ratio = Math.max(width / img.width, height / img.height);
        const drawWidth = img.width * ratio;
        const drawHeight = img.height * ratio;
        const drawX = x + (width - drawWidth) / 2;
        const drawY = y + (height - drawHeight) / 2;
        ctx.save();
        roundRectPath(ctx, x, y, width, height, radius);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
    }
    function fitCanvasText(ctx, text, maxWidth) {
        let value = String(text || '');
        if (ctx.measureText(value).width <= maxWidth) {
            return value;
        }
        while (value.length > 0 && ctx.measureText(value + '…').width > maxWidth) {
            value = value.slice(0, -1);
        }
        return value + '…';
    }
    function getSimklStoryWatchedLabel(watchedAt) {
        if (!watchedAt)
            return '';
        const date = new Date(watchedAt);
        if (isNaN(date.getTime()))
            return '';
        const formatted = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        return 'Assistido em ' + formatted;
    }
    function slugifyText(value) {
        return String(value || 'simkl-story')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    function canvasToBlob(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                    return;
                }
                reject(new Error('Não foi possível gerar a imagem final.'));
            }, 'image/png');
        });
    }
    async function getStoryAvatarImage() {
        try {
            return await loadCanvasImage(SIMKL_STORY_AVATAR_URL);
        }
        catch (error) {
            const fallbackAvatar = document.getElementById('discord-avatar');
            if (fallbackAvatar && fallbackAvatar.getAttribute('src')) {
                return await loadCanvasImage(fallbackAvatar.getAttribute('src'));
            }
            throw error;
        }
    }
    // Helpers visuais do story da Simkl
    function drawOriginalSimklLogo(ctx, x, y, logoWidth, logoHeight, color) {
        const simklPath = new Path2D('M3.84 0A3.832 3.832 0 0 0 0 3.84v16.32A3.832 3.832 0 0 0 3.84 24h16.32A3.832 3.832 0 0 0 24 20.16V3.84A3.832 3.832 0 0 0 20.16 0zm8.567 4.11c2.074 0 3.538.061 4.393.186 1.127.168 1.94.46 2.438.877.672.578 1.009 1.613 1.009 3.104 0 .161-.004.417-.01.768h-4.234c-.014-.358-.039-.607-.074-.746-.098-.41-.42-.64-.966-.692-.484-.043-1.66-.066-3.53-.066-1.85 0-2.946.056-3.289.165-.385.133-.578.474-.578 1.024 0 .528.203.851.61.969.343.095 1.887.187 4.633.275 2.487.073 4.073.165 4.76.275.693.11 1.244.275 1.654.495.41.22.737.532.983.936.37.595.557 1.552.557 2.873 0 1.475-.182 2.557-.546 3.247-.364.683-.96 1.149-1.785 1.398-.812.25-3.05.374-6.71.374-2.226 0-3.832-.062-4.82-.187-1.204-.147-2.068-.434-2.593-.86-.567-.456-.903-1.1-1.008-1.93a10.522 10.522 0 0 1-.085-1.434v-.789H7.44c-.007.74.136 1.216.43 1.428.154.102.33.167.525.203.196.037.54.063 1.03.077a166.2 166.2 0 0 0 2.405.022c1.862-.007 2.94-.018 3.234-.033.553-.044.917-.12 1.092-.23.245-.161.368-.52.368-1.077 0-.38-.078-.648-.231-.802-.211-.212-.712-.325-1.503-.34-.547 0-1.688-.044-3.425-.132-1.794-.088-2.956-.14-3.488-.154-1.387-.044-2.364-.212-2.932-.505-.728-.373-1.205-1.01-1.429-1.91-.126-.498-.189-1.15-.189-1.956 0-1.698.309-2.895.925-3.59.462-.527 1.163-.875 2.102-1.044.848-.146 2.865-.22 6.053-.22z');
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(logoWidth / 24, logoHeight / 24);
        ctx.fillStyle = color;
        ctx.fill(simklPath);
        ctx.restore();
    }
    function clampOriginalSimklColor(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }
    function mixOriginalSimklColor(colorA, colorB, weight) {
        return {
            r: Math.round(colorA.r + (colorB.r - colorA.r) * weight),
            g: Math.round(colorA.g + (colorB.g - colorA.g) * weight),
            b: Math.round(colorA.b + (colorB.b - colorA.b) * weight)
        };
    }
    function originalSimklColorToCss(color) {
        return 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
    }
    function sampleOriginalSimklPosterAverageColor(img) {
        const sampleCanvas = document.createElement('canvas');
        const sampleCtx = sampleCanvas.getContext('2d');
        if (!sampleCtx)
            return null;
        sampleCanvas.width = 24;
        sampleCanvas.height = 24;
        try {
            sampleCtx.drawImage(img, 0, 0, 24, 24);
            const imageData = sampleCtx.getImageData(0, 0, 24, 24).data;
            let r = 0;
            let g = 0;
            let b = 0;
            let total = 0;
            for (let i = 0; i < imageData.length; i += 4) {
                const alpha = imageData[i + 3];
                if (alpha < 16)
                    continue;
                r += imageData[i];
                g += imageData[i + 1];
                b += imageData[i + 2];
                total++;
            }
            if (!total)
                return null;
            return {
                r: Math.round(r / total),
                g: Math.round(g / total),
                b: Math.round(b / total)
            };
        }
        catch {
            return null;
        }
    }
    function paintOriginalSimklStoryBackground(ctx, posterImg) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
        if (!posterImg) {
            gradient.addColorStop(0, '#5d6f80');
            gradient.addColorStop(0.48, '#1a2530');
            gradient.addColorStop(1, '#020305');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1920);
            return;
        }
        const sampled = sampleOriginalSimklPosterAverageColor(posterImg);
        if (!sampled) {
            gradient.addColorStop(0, '#5d6f80');
            gradient.addColorStop(0.48, '#1a2530');
            gradient.addColorStop(1, '#020305');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1920);
            return;
        }
        const normalized = {
            r: clampOriginalSimklColor(sampled.r, 0, 255),
            g: clampOriginalSimklColor(sampled.g, 0, 255),
            b: clampOriginalSimklColor(sampled.b, 0, 255)
        };
        const topColor = mixOriginalSimklColor(normalized, { r: 210, g: 225, b: 240 }, 0.38);
        const midColor = mixOriginalSimklColor(normalized, { r: 20, g: 28, b: 38 }, 0.58);
        const bottomColor = mixOriginalSimklColor(normalized, { r: 2, g: 3, b: 6 }, 0.86);
        gradient.addColorStop(0, originalSimklColorToCss(topColor));
        gradient.addColorStop(0.48, originalSimklColorToCss(midColor));
        gradient.addColorStop(1, originalSimklColorToCss(bottomColor));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1920);
    }
    let simklStoryTransparentMode = false;
    async function generateSimklStoryBlob(options = {}) {
        if (!currentSimklStoryData) {
            throw new Error('Nenhum item do Simkl carregado no momento.');
        }
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas não suportado neste navegador.');
        }
        const transparentBackground = Boolean(options.transparentBackground);
        const title = currentSimklStoryData.show || 'Série';
        const season = String(currentSimklStoryData.season || 0).padStart(2, '0');
        const episodeNumber = String(currentSimklStoryData.episodeNumber || 0).padStart(2, '0');
        const episodeTitle = currentSimklStoryData.episode || 'Episódio';
        const episodeLine = 'S' + season + 'E' + episodeNumber + ' • ' + episodeTitle;
        const watchedLabel = getSimklStoryWatchedLabel(currentSimklStoryData.watchedAt);
        const posterEl = document.getElementById('simkl-modal-poster');
        const cardPosterEl = document.getElementById('simkl-poster');
        const posterSrcFromData = currentSimklStoryData.poster || '';
        const posterSrcFromCard = cardPosterEl
            ? (cardPosterEl.currentSrc || cardPosterEl.src || cardPosterEl.getAttribute('src') || '')
            : '';
        const posterSrcFromModal = posterEl
            ? (posterEl.currentSrc || posterEl.src || posterEl.getAttribute('src') || '')
            : '';
        const posterSrc = posterSrcFromData || posterSrcFromCard || posterSrcFromModal;
        let posterImg = null;
        try {
            posterImg = await loadCanvasImage(posterSrc);
        }
        catch (error) {
            console.error('Poster do Simkl não carregou para o story:', posterSrc, error);
            throw new Error('O pôster do Simkl não carregou para o story. URL usada: ' + posterSrc);
        }
        if (!transparentBackground) {
            paintOriginalSimklStoryBackground(ctx, posterImg);
            const overlay = ctx.createLinearGradient(0, 0, 0, 1920);
            overlay.addColorStop(0, 'rgba(0,0,0,0.04)');
            overlay.addColorStop(0.7, 'rgba(0,0,0,0.22)');
            overlay.addColorStop(1, 'rgba(0,0,0,0.78)');
            ctx.fillStyle = overlay;
            ctx.fillRect(0, 0, 1080, 1920);
        }
        const posterWidth = 690;
        const posterHeight = 1025;
        const posterX = (1080 - posterWidth) / 2;
        const posterBaseY = 295;
        const avatarSize = 131;
        const groupBaseTopY = posterBaseY - 86;
        const groupBaseBottomY = posterBaseY + posterHeight + 117 + 80 + 106 + 82 + 88 + 50;
        const layoutOffsetY = Math.round((1920 / 2) - ((groupBaseTopY + groupBaseBottomY) / 2));
        const posterY = posterBaseY + layoutOffsetY;
        const avatarY = posterY - 86;
        const titleY = posterY + posterHeight + 117;
        const episodeY = titleY + 80;
        const ratingY = episodeY + 106;
        const onY = ratingY + 82;
        const logoY = onY + 88;
        if (posterImg) {
            drawCoverImage(ctx, posterImg, posterX, posterY, posterWidth, posterHeight, 28);
        }
        else {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            roundRectPath(ctx, posterX, posterY, posterWidth, posterHeight, 28);
            ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 2;
        roundRectPath(ctx, posterX, posterY, posterWidth, posterHeight, 28);
        ctx.stroke();
        try {
            const avatar = await loadCanvasImage('assets/images/simkl-story-avatar.webp');
            const x = (1080 - avatarSize) / 2;
            const y = avatarY;
            ctx.save();
            ctx.beginPath();
            ctx.arc(540, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
            ctx.restore();
        }
        catch (error) {
            console.warn('Avatar do story não carregou.', error);
        }
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 72px Inter, Arial, sans-serif';
        ctx.fillText(fitCanvasText(ctx, title, 880), 540, titleY);
        ctx.fillStyle = 'rgba(255,255,255,0.90)';
        ctx.font = '600 40px Inter, Arial, sans-serif';
        ctx.fillText(fitCanvasText(ctx, episodeLine, 900), 540, episodeY);
        if (watchedLabel) {
            ctx.fillStyle = '#FFBF00';
            ctx.font = '700 40px Inter, Arial, sans-serif';
            ctx.fillText(fitCanvasText(ctx, watchedLabel, 820), 540, ratingY);
        }
        const lineGap = 46;
        const lineWidth = 150;
        ctx.strokeStyle = 'rgba(255,255,255,0.30)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(540 - lineGap - lineWidth, onY);
        ctx.lineTo(540 - lineGap, onY);
        ctx.moveTo(540 + lineGap, onY);
        ctx.lineTo(540 + lineGap + lineWidth, onY);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.font = '700 28px Inter, Arial, sans-serif';
        ctx.fillText('ON', 540, onY + 10);
        const logoWidth = 50;
        const logoHeight = 50;
        ctx.font = '800 60px Inter, Arial, sans-serif';
        const simklText = 'Simkl';
        const textWidth = ctx.measureText(simklText).width;
        const groupGap = 14;
        const groupWidth = logoWidth + groupGap + textWidth;
        const groupX = (1080 - groupWidth) / 2;
        try {
            const simklIcon = await loadCanvasImage('assets/images/simkl-icon.webp');
            ctx.drawImage(simklIcon, groupX, logoY - 40, logoWidth, logoHeight);
        }
        catch (error) {
            console.warn('Ícone do Simkl não carregou.', error);
            drawOriginalSimklLogo(ctx, groupX, logoY - 28, 44, 35.2, '#FFBF00');
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(simklText, groupX + logoWidth + groupGap, logoY);
        return await canvasToBlob(canvas);
    }
    async function shareOrDownloadSimklStory(blob, filename) {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: 'Story do Simkl',
                    text: 'Gerado no meu portfólio',
                    files: [file]
                });
                return;
            }
            catch (error) {
                if (error && error.name === 'AbortError') {
                    return;
                }
            }
        }
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1200);
    }
    async function handleSimklStoryShare(event) {
        event.preventDefault();
        event.stopPropagation();
        const button = document.getElementById('simkl-story-btn');
        if (!button)
            return;
        const originalHtml = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<svg aria-hidden="true" class="icon" viewbox="0 0 512 512"><path d="M304 48a16 16 0 1 0-32 0l0 48a16 16 0 1 0 32 0l0-48zM188.7 100.7a16 16 0 0 0-22.6 22.6l33.9 33.9a16 16 0 1 0 22.6-22.6l-33.9-33.9zM96 240a16 16 0 1 0 0 32l48 0a16 16 0 1 0 0-32l-48 0zm326.6-116.7a16 16 0 0 0-22.6-22.6l-33.9 33.9a16 16 0 0 0 22.6 22.6l33.9-33.9zM368 256a112 112 0 1 1-224 0 112 112 0 1 1 224 0zm48 0A160 160 0 1 0 96 256a160 160 0 1 0 320 0zm-50.1 98.1a16 16 0 1 0-22.6 22.6l33.9 33.9a16 16 0 1 0 22.6-22.6l-33.9-33.9zM256 416a16 16 0 1 0-16 16l0 48a16 16 0 1 0 32 0l0-48a16 16 0 1 0-16-16zm-89.4-39.4a16 16 0 0 0-22.6-22.6l-33.9 33.9a16 16 0 1 0 22.6 22.6l33.9-33.9z"></path></svg><span>Gerando...</span>';
        try {
            const blob = await generateSimklStoryBlob({ transparentBackground: simklStoryTransparentMode });
            const filename = 'simkl-story-' + slugifyText(currentSimklStoryData && currentSimklStoryData.show ? currentSimklStoryData.show : 'serie') + '.png';
            await shareOrDownloadSimklStory(blob, filename);
        }
        catch (error) {
            console.error('Erro ao gerar story do Simkl:', error);
            alert(error instanceof Error ? error.message : 'Não foi possível gerar a imagem do story.');
        }
        finally {
            button.disabled = false;
            button.innerHTML = getSimklStoryButtonHtml();
        }
    }
    function updateSimklModal(data) {
        const safeFallback = 'https://placehold.co/300x450/14161e/94a3b8?text=TV';
        const poster = data.poster || safeFallback;
        const season = String(data.season || 0).padStart(2, '0');
        const episodeNumber = String(data.episodeNumber || 0).padStart(2, '0');
        const episodeText = `S${season}E${episodeNumber} — ${data.episode || 'Episódio'}`;
        const hasRating = Boolean(renderSimklStars(data.rating));
        const ratingText = hasRating ? renderSimklStars(data.rating) : (data.genres || '');
        const modalPoster = document.getElementById('simkl-modal-poster');
        const modalBg = document.getElementById('simkl-modal-bg');
        const modalTitle = document.getElementById('simkl-modal-title');
        const modalEpisode = document.getElementById('simkl-modal-episode');
        const modalRating = document.getElementById('simkl-modal-rating');
        const openLink = document.getElementById('simkl-open-link');
        if (modalPoster) {
            modalPoster.onerror = function () { this.src = safeFallback; };
            setImageSrcIfChanged(modalPoster, poster);
        }
        currentSeriesRecommendationTarget = {
            type: 'series',
            title: data.show || 'Série não encontrada',
            year: data.year || '',
            extra: episodeText ? `Episódio atual: ${episodeText}` : ''
        };
        resetGeminiRecommendation('simkl');
        if (modalBg)
            modalBg.style.backgroundImage = `url('${poster}')`;
        if (modalTitle)
            modalTitle.textContent = data.show || 'Série não encontrada';
        if (modalEpisode)
            modalEpisode.textContent = episodeText;
        if (modalRating) {
            modalRating.textContent = ratingText || '';
            modalRating.classList.toggle('share-modal-rating--genres', !hasRating && Boolean(ratingText));
        }
        if (openLink)
            openLink.href = SIMKL_HISTORY_URL;
    }
    async function fetchSimkl() {
        const cachedData = readTimedMediaCache(SIMKL_CACHE_KEY, SIMKL_CACHE_TTL_MS);
        if (cachedData) {
            renderSimklData(cachedData);
        }
        try {
            const response = await fetch(API_ENDPOINTS.simkl);
            if (!response.ok) {
                throw new Error('Resposta inválida da API do Simkl.');
            }
            const data = await response.json();
            if (!isValidSimklData(data))
                return;
            if (renderSimklData(data)) {
                writeTimedMediaCache(SIMKL_CACHE_KEY, data);
            }
        }
        catch (error) {
            console.error('Erro no Simkl:', error);
        }
    }
    fetchSimkl();
    // Ponte entre o story da Simkl e o painel admin
    function ensureOriginalSimklStoryButton() {
        let button = document.getElementById('simkl-story-btn');
        if (button)
            return button;
        button = document.createElement('button');
        button.id = 'simkl-story-btn';
        button.type = 'button';
        button.hidden = true;
        button.innerHTML = getSimklStoryButtonHtml();
        document.body.appendChild(button);
        return button;
    }
    async function fetchFreshSimklStoryDataFromAdmin() {
        try {
            localStorage.removeItem(SIMKL_CACHE_KEY);
        }
        catch { }
        const response = await fetch(API_ENDPOINTS.simkl, {
            cache: 'no-store'
        });
        if (!response.ok) {
            throw new Error('Resposta inválida da API do Simkl.');
        }
        const data = await response.json();
        if (!isValidSimklData(data)) {
            throw new Error('Dados inválidos da API do Simkl.');
        }
        if (!data.poster || String(data.poster).includes('placehold.co')) {
            throw new Error('A API do Simkl retornou sem pôster real.');
        }
        renderSimklData(data);
        writeTimedMediaCache(SIMKL_CACHE_KEY, data);
        updateSimklModal(data);
        currentSimklStoryData = data;
        return data;
    }
    function syncFreshSimklPoster(data) {
        const poster = data.poster;
        const cardPoster = document.getElementById('simkl-poster');
        const modalPoster = document.getElementById('simkl-modal-poster');
        const modalBg = document.getElementById('simkl-modal-bg');
        if (cardPoster) {
            cardPoster.crossOrigin = 'anonymous';
            cardPoster.referrerPolicy = 'no-referrer';
            setImageSrcIfChanged(cardPoster, poster);
        }
        if (modalPoster) {
            modalPoster.crossOrigin = 'anonymous';
            modalPoster.referrerPolicy = 'no-referrer';
            setImageSrcIfChanged(modalPoster, poster);
        }
        if (modalBg) {
            modalBg.style.backgroundImage = `url('${poster}')`;
        }
        currentSimklStoryData.poster = poster;
    }
    async function runSimklStoryFromAdminIntent() {
        try {
            const params = new URLSearchParams(window.location.search);
            const storyMode = params.get('simklStory');
            const wantsTransparentStory = storyMode === 'transparent';
            const wantsStory = storyMode === '1' || wantsTransparentStory;
            if (!wantsStory)
                return;
            simklStoryTransparentMode = wantsTransparentStory;
            window.history.replaceState({}, document.title, '/');
            const freshData = await fetchFreshSimklStoryDataFromAdmin();
            syncFreshSimklPoster(freshData);
            ensureOriginalSimklStoryButton();
            await handleSimklStoryShare({
                preventDefault() { },
                stopPropagation() { }
            });
        }
        catch (error) {
            simklStoryTransparentMode = false;
            console.error('Erro ao gerar story do Simkl pelo admin:', error);
            alert(error instanceof Error ? error.message : 'Não foi possível gerar o story do Simkl pelo admin.');
        }
    }
    runSimklStoryFromAdminIntent();
    const simklCard = document.getElementById('simkl-card');
    const simklModal = document.getElementById('simkl-modal');
    const closeSimklModalBtn = document.getElementById('close-simkl-modal');
    function openSimklModal() {
        simklModal.classList.add('active');
        simklModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    function closeSimklModalFn() {
        simklModal.classList.remove('active');
        simklModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
    if (simklCard && simklModal) {
        simklCard.addEventListener('click', openSimklModal);
        simklCard.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openSimklModal();
        } });
    }
    if (closeSimklModalBtn)
        closeSimklModalBtn.addEventListener('click', closeSimklModalFn);
    if (simklModal)
        simklModal.addEventListener('click', (e) => { if (e.target === simklModal)
            closeSimklModalFn(); });
    // RECOMENDAÇÕES COM GEMINI
    const GEMINI_RECOMMENDATION_API = API_ENDPOINTS.gemini;
    const GEMINI_CACHE_PREFIX = 'gemini-recommendation:';
    const GEMINI_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 horas
    const GEMINI_COOLDOWN_MS = 10000; // 10 segundos
    const geminiPendingBySource = {
        lb: false,
        simkl: false
    };
    const geminiLastRequestAtBySource = {
        lb: 0,
        simkl: 0
    };
    function getGeminiElements(source) {
        return {
            button: document.getElementById(`${source}-recommend-btn`),
            box: document.getElementById(`${source}-recommendation-box`)
        };
    }
    function getGeminiButtonHtml() {
        return `
        <svg aria-hidden="true" class="icon" viewbox="0 -24 512 592">
                            <path
                                d="M512 80c0 18-14.3 34.6-38.4 48c24.1 13.4 38.4 30 38.4 48c0 26.5-31.3 48-70 48s-70-21.5-70-48c0-18 14.3-34.6 38.4-48c-24.1-13.4-38.4-30-38.4-48c0-26.5 31.3-48 70-48s70 21.5 70 48zM160 96l32 96l96 32l-96 32l-32 96l-32-96l-96-32l96-32l32-96zM448 320l16 48l48 16l-48 16l-16 48l-16-48l-48-16l48-16l16-48zM256 352l24 72l72 24l-72 24l-24 72l-24-72l-72-24l72-24l24-72z">
            </path>
        </svg>
        Recomendação
    `;
    }
    function resetGeminiRecommendation(source) {
        const { box } = getGeminiElements(source);
        if (!box)
            return;
        box.classList.remove('active');
        box.innerHTML = '';
    }
    function escapeGeminiHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    function getGeminiCacheKey(target) {
        const type = String(target?.type || '').toLowerCase().trim();
        const title = String(target?.title || '').toLowerCase().trim();
        const year = String(target?.year || '').toLowerCase().trim();
        return `${GEMINI_CACHE_PREFIX}${type}:${title}:${year}`;
    }
    function getCachedGeminiRecommendation(target) {
        try {
            const cacheKey = getGeminiCacheKey(target);
            const rawCache = localStorage.getItem(cacheKey);
            if (!rawCache)
                return null;
            const cached = JSON.parse(rawCache);
            if (!cached?.createdAt || !Array.isArray(cached.recommendations)) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            const isExpired = Date.now() - cached.createdAt > GEMINI_CACHE_TTL_MS;
            if (isExpired) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            return cached.recommendations;
        }
        catch {
            return null;
        }
    }
    function setCachedGeminiRecommendation(target, recommendations) {
        try {
            if (!Array.isArray(recommendations) || recommendations.length === 0)
                return;
            const cacheKey = getGeminiCacheKey(target);
            localStorage.setItem(cacheKey, JSON.stringify({
                createdAt: Date.now(),
                recommendations: recommendations.slice(0, 3)
            }));
        }
        catch {
            // Se o navegador bloquear localStorage, apenas ignora.
        }
    }
    function showGeminiMessage(source, title, message) {
        const { box } = getGeminiElements(source);
        if (!box)
            return;
        box.innerHTML = `
        <span class="gemini-recommendation-title">${escapeGeminiHtml(title)}</span>
        ${escapeGeminiHtml(message)}
    `;
        box.classList.add('active');
    }
    function renderGeminiRecommendations(source, recommendations, fromCache = false) {
        const { box } = getGeminiElements(source);
        if (!box)
            return;
        if (!Array.isArray(recommendations) || recommendations.length === 0) {
            box.innerHTML = `
            <span class="gemini-recommendation-title">Recomendação</span>
            Nenhuma recomendação encontrada agora.
        `;
            box.classList.add('active');
            return;
        }
        const itemsHtml = recommendations.slice(0, 3).map((item) => {
            const title = escapeGeminiHtml(item.title || 'Título não informado');
            const year = item.year ? ` (${escapeGeminiHtml(item.year)})` : '';
            const reason = escapeGeminiHtml(item.reason || 'Obra com elementos parecidos.');
            return `
            <div class="gemini-recommendation-item">
                <strong>${title}${year}</strong><br>
                <span>${reason}</span>
            </div>
        `;
        }).join('');
        box.innerHTML = `
        <span class="gemini-recommendation-title">
            Recomendações da IA${fromCache ? ' · cache' : ''}
        </span>
        <div class="gemini-recommendation-list">
            ${itemsHtml}
        </div>
    `;
        box.classList.add('active');
    }
    function getGeminiFriendlyErrorMessage(status, data) {
        if (status === 429) {
            return 'Limite temporário de uso da IA atingido. Tente novamente em alguns minutos.';
        }
        if (status === 503) {
            return 'A IA está sobrecarregada agora. Tente novamente em instantes.';
        }
        if (data?.details?.error?.message) {
            return data.details.error.message;
        }
        if (data?.details) {
            return String(data.details);
        }
        if (data?.error) {
            return String(data.error);
        }
        return 'Não foi possível gerar recomendações agora.';
    }
    async function handleGeminiRecommendation(source) {
        const target = source === 'lb'
            ? currentMovieRecommendationTarget
            : currentSeriesRecommendationTarget;
        const { button, box } = getGeminiElements(source);
        if (!target || !target.title) {
            showGeminiMessage(source, 'Recomendação', 'Ainda não há dados suficientes para recomendar.');
            return;
        }
        if (geminiPendingBySource[source]) {
            showGeminiMessage(source, 'Recomendação', 'Aguarde a recomendação atual terminar.');
            return;
        }
        const cachedRecommendations = getCachedGeminiRecommendation(target);
        if (cachedRecommendations) {
            renderGeminiRecommendations(source, cachedRecommendations, true);
            return;
        }
        const now = Date.now();
        const timeSinceLastRequest = now - geminiLastRequestAtBySource[source];
        if (timeSinceLastRequest < GEMINI_COOLDOWN_MS) {
            const secondsToWait = Math.ceil((GEMINI_COOLDOWN_MS - timeSinceLastRequest) / 1000);
            showGeminiMessage(source, 'Recomendação', `Aguarde ${secondsToWait} segundo(s) antes de pedir outra recomendação.`);
            return;
        }
        try {
            geminiPendingBySource[source] = true;
            geminiLastRequestAtBySource[source] = Date.now();
            if (button) {
                button.disabled = true;
                button.innerHTML = `
                <span class="gemini-loader" aria-hidden="true" style="width: 14px; height: 14px; border-width: 2px;"></span>
                Gerando...
            `;
            }
            if (box) {
                box.innerHTML = `
                <span class="gemini-recommendation-title">Recomendação</span>
                Buscando sugestões parecidas<span class="loading-dots"></span>
            `;
                box.classList.add('active');
            }
            const response = await fetch(GEMINI_RECOMMENDATION_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(target)
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.error) {
                throw new Error(getGeminiFriendlyErrorMessage(response.status, data));
            }
            const recommendations = Array.isArray(data.recommendations)
                ? data.recommendations.slice(0, 3)
                : [];
            setCachedGeminiRecommendation(target, recommendations);
            renderGeminiRecommendations(source, recommendations);
        }
        catch (error) {
            console.error('Erro ao buscar recomendação Gemini:', error);
            showGeminiMessage(source, 'Recomendação', error instanceof Error
                ? error.message
                : 'Não foi possível gerar recomendações agora.');
        }
        finally {
            geminiPendingBySource[source] = false;
            if (button) {
                button.disabled = false;
                button.innerHTML = getGeminiButtonHtml();
            }
        }
    }
    const lbRecommendBtn = document.getElementById('lb-recommend-btn');
    const simklRecommendBtn = document.getElementById('simkl-recommend-btn');
    if (lbRecommendBtn) {
        lbRecommendBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleGeminiRecommendation('lb');
        });
    }
    if (simklRecommendBtn) {
        simklRecommendBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleGeminiRecommendation('simkl');
        });
    }
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (techModal && techModal.classList.contains('active')) {
                techModal.classList.remove('active');
                document.body.style.overflow = '';
            }
            if (simklModal && simklModal.classList.contains('active'))
                closeSimklModalFn();
            if (lbModal && lbModal.classList.contains('active'))
                closeLbModalFn();
            closeSpotifyHistoryModalIfOpen();
        }
    });
    const catGif = document.getElementById('wyd-cat');
    function showCatAt(clickX, clickY) {
        catGif.style.display = 'block';
        const catWidth = catGif.offsetWidth || 180;
        const catHeight = catGif.offsetHeight || 180;
        let posX = clickX;
        let posY = clickY;
        const margem = 10;
        if (posX + catWidth + margem > window.innerWidth) {
            posX = window.innerWidth - catWidth - margem;
        }
        if (posY + catHeight + margem > window.innerHeight) {
            posY = window.innerHeight - catHeight - margem;
        }
        catGif.style.left = posX + 'px';
        catGif.style.top = posY + 'px';
    }
    window.addEventListener('contextmenu', function (evento) {
        evento.preventDefault();
        const clickX = evento.clientX;
        const clickY = evento.clientY;
        if (!catGif.getAttribute('src')) {
            catGif.src = catGif.dataset.src;
            if (!catGif.complete) {
                catGif.addEventListener('load', () => {
                    showCatAt(clickX, clickY);
                }, { once: true });
                return;
            }
        }
        showCatAt(clickX, clickY);
    });
    window.addEventListener('click', function () {
        catGif.style.display = 'none';
    });
}
