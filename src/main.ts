// @ts-nocheck
import { isPageVisible, setImageSrcIfChanged, setContainerHtmlIfChanged } from './utils.js';
import { initDiscord } from './discord.js';
import { initMusic, closeSpotifyHistoryModalIfOpen } from './spotify.js';
import { initMedia } from './media.js';
import { initAdmin } from './auth.js';

// Ajuste específico para reduzir o piscar dos modais no navegador interno do Instagram.
        // Não altera o layout; apenas troca para transições de blur/opacity mais estáveis no WebView.
        if (/Instagram/i.test(navigator.userAgent)) {
            document.documentElement.classList.add('instagram-webview');
        }

        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(typeWriter, 350);
        });

        // ==========================================
        // TYPEWRITER EFFECT (OTIMIZADO PARA LCP/FCP)
        // ==========================================
        const textToType = "Entusiasta de programação explorando conhecimento. Gamer, cinéfilo e amante da música.";
        const typingElement = document.getElementById('typing-text');
        let typeIndex = 0;
        let typewriterStarted = false;

        function typeWriter() {
            if (!typingElement) return;

            if (!typewriterStarted) {
                typewriterStarted = true;
                typeIndex = 0;

                typingElement.textContent = '';
                typingElement.classList.add('typing-active');
                typingElement.classList.remove('typing-done');

                window.setTimeout(() => {
                    if (
                        typingElement &&
                        typingElement.classList.contains('typing-active') &&
                        typingElement.textContent.trim().length < 3
                    ) {
                        typingElement.textContent = textToType;
                        typingElement.classList.remove('typing-active');
                        typingElement.classList.add('typing-done');
                    }
                }, 900);
            }

            if (typeIndex < textToType.length) {
                typingElement.textContent += textToType.charAt(typeIndex);
                typeIndex++;
                setTimeout(typeWriter, 15);
            } else {
                typingElement.classList.remove('typing-active');
                typingElement.classList.add('typing-done');
            }
        }

        // ==========================================
        // TOOLTIP E MODAL DE TECNOLOGIAS
        // ==========================================
        const tooltip = document.getElementById('tech-tooltip');
        const techBoxes = document.querySelectorAll('.tech-box');

        techBoxes.forEach(box => {
            box.addEventListener('mouseenter', (e) => {
                if (window.innerWidth < 900) return;
                document.getElementById('tt-name').textContent = box.dataset.name;
                document.getElementById('tt-desc').textContent = box.dataset.desc;
                document.getElementById('tt-tag').textContent = box.dataset.tag;
                document.getElementById('tt-footer-text').textContent = box.dataset.footer;
                document.getElementById('tt-icon').innerHTML = box.innerHTML;

                const rect = box.getBoundingClientRect();
                let leftPosition = rect.left + (rect.width / 2);
                const topPosition = rect.bottom;

                tooltip.style.left = `${leftPosition}px`;
                tooltip.style.top = `${topPosition}px`;
                tooltip.classList.add('active');
            });
            box.addEventListener('mouseleave', () => { tooltip.classList.remove('active'); });
        });

        const mobileProjectsCard = document.getElementById('projects-card-mobile');
        const techModal = document.getElementById('mobile-tech-modal');
        const closeTechModal = document.getElementById('close-tech-modal');

        mobileProjectsCard.addEventListener('click', () => {
            techModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        closeTechModal.addEventListener('click', () => {
            techModal.classList.remove('active');
            document.body.style.overflow = '';
        });

        techModal.addEventListener('click', (e) => {
            if (e.target === techModal) {
                techModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // ==========================================
        // DISCORD (Status e Jogos)
        // Lógica movida para discord.ts
        // ==========================================
        initDiscord();

        // ==========================================
        // SISTEMA MUSICAL (SPOTIFY + LAST.FM)
        // Lógica movida para spotify.ts
        // ==========================================
        initMusic();

        // ==========================================
        // LETTERBOXD + TRAKT + RECOMENDAÇÕES GEMINI
        // Lógica movida para media.ts
        // ==========================================
        initMedia();

        // ==========================================
        // AUTENTICAÇÃO (SUPABASE) + PAINEL ADMIN
        // Lógica movida para auth.ts
        // ==========================================
        initAdmin();

