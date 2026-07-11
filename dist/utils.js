// ==========================================
// UTILITÁRIOS COMPARTILHADOS
// Funções usadas por várias seções (Discord, Spotify, Letterboxd, Trakt...)
// ==========================================
export function isPageVisible() {
    return document.visibilityState === 'visible';
}
export function setImageSrcIfChanged(img, newSrc) {
    if (!img || !newSrc)
        return;
    if (img.getAttribute('src') !== newSrc)
        img.src = newSrc;
}
export function setContainerHtmlIfChanged(container, html) {
    if (!container)
        return;
    if (container.dataset.currentHtml !== html) {
        container.innerHTML = html;
        container.dataset.currentHtml = html;
    }
}
