// UTILITÁRIOS COMPARTILHADOS
// Funções usadas por várias seções (Discord, Spotify, Letterboxd, Simkl...)

export function isPageVisible(): boolean {
    return document.visibilityState === 'visible';
}

export function setImageSrcIfChanged(img: HTMLImageElement | null, newSrc: string): void {
    if (!img || !newSrc) return;
    if (img.getAttribute('src') !== newSrc) img.src = newSrc;
}

export function setContainerHtmlIfChanged(container: HTMLElement | null, html: string): void {
    if (!container) return;
    if (container.dataset.currentHtml !== html) {
        container.innerHTML = html;
        container.dataset.currentHtml = html;
    }
}
