// ==UserScript==
// @name         Suno Sovereign Link (Auto-Updater)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Extrae automáticamente el Session ID de Suno y lo envía a Sunopo
// @author       Iyari Gomez System
// @match        https://suno.com/*
// @match        https://soundcloud.com/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      soundcloud.com
// ==/UserScript==

(function () {
    'use strict';

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Expose a lightweight helper to the page so other scripts (like SoundCloud automation)
    // can fetch or attach the current session token automatically.
    window.SunoPo = {
        getSessionToken: function() {
            try { return localStorage.getItem('SUNOPO_SESSION_TOKEN'); } catch (e) { return null; }
        },
        request: function(path, options = {}) {
            // Prefer bridge if available (GM_xmlhttpRequest is only available to the userscript)
            const useBridge = !!window.SUNOPO_BRIDGE_AVAILABLE;
            if (useBridge) {
                return new Promise((resolve, reject) => {
                    const id = 'sp_req_' + Math.random().toString(36).substring(2, 9);
                    function onResponse(e) {
                        if (!e.data || e.data.type !== 'SunopoResponse' || e.data.id !== id) return;
                        window.removeEventListener('message', onResponse);
                        if (e.data.status >= 200 && e.data.status < 300) {
                            resolve({ ok: true, status: e.data.status, json: async () => JSON.parse(e.data.responseText) });
                        } else {
                            resolve({ ok: false, status: e.data.status, text: async () => e.data.responseText });
                        }
                    }
                    window.addEventListener('message', onResponse);
                    window.postMessage({ type: 'SunopoRequest', id, path, method: options.method || (options.data ? 'POST' : 'GET'), data: options.data || null }, '*');
                    // timeout
                    setTimeout(() => { window.removeEventListener('message', onResponse); reject(new Error('Sunopo bridge timeout')); }, 10000);
                });
            }

            const token = this.getSessionToken();
            const headers = options.headers || {};
            if (token) {
                headers['X-Session-Token'] = token;
                headers['Authorization'] = 'Bearer ' + token;
            }
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';

            return fetch('http://localhost:5555' + path, Object.assign({}, options, { headers }));
        }
    };

    // Indicate that the bridge is available (the userscript message handler will set this flag when initialized)
    window.SUNOPO_BRIDGE_AVAILABLE = true;

    function sendToSunopo(path, data, callback) {
        const token = (() => { try { return localStorage.getItem('SUNOPO_SESSION_TOKEN'); } catch (e) { return null; } })();
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['X-Session-Token'] = token;
            headers['Authorization'] = 'Bearer ' + token;
        }

        GM_xmlhttpRequest({
            method: data ? "POST" : "GET",
            url: `http://localhost:5555${path}`,
            data: data ? JSON.stringify(data) : undefined,
            headers: headers,
            withCredentials: true,
            onload: function (response) {
                if (callback) callback(response);
            }
        });
    }

    function syncSession() {
        // En Suno, el ID de sesión suele estar en la cookie '__client' o similar
        // Pero lo más seguro es capturarlo de las cabeceras o de todas las cookies
        const sessionId = document.cookie; // Enviamos el string completo de cookies que es lo que Suno-API necesita

        if (sessionId && sessionId.includes('sid=')) {
            console.log("🚀 Suno Sovereign Link: Sincronizando con Sunopo...");

            sendToSunopo('/api/session', { session_id: sessionId }, function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.success && data.session_token) {
                        // Store token in the page's localStorage so other scripts can use it
                        try { localStorage.setItem('SUNOPO_SESSION_TOKEN', data.session_token); } catch (e) {}
                        console.log("✅ Sunopo session created and token stored.");
                    } else if (data.success) {
                        console.log("✅ Sunopo session created (no token returned)");
                    }
                } catch (e) {
                    console.log('Unexpected response from Sunopo session endpoint', e);
                }
            });

            // Add message bridge handler to process requests from page context and proxy via GM_xmlhttpRequest
            window.addEventListener('message', function(event) {
                try {
                    if (!event.data || event.data.type !== 'SunopoRequest') return;
                    // Only accept messages from the same origin (e.g., soundcloud page)
                    if (event.origin !== window.location.origin) return;

                    const id = event.data.id;
                    const path = event.data.path || '/';
                    const method = event.data.method || 'GET';
                    const data = event.data.data ? JSON.stringify(event.data.data) : null;

                    // Only allow proxying to our backend on localhost for safety
                    const url = 'http://localhost:5555' + path;

                    GM_xmlhttpRequest({
                        method: method,
                        url: url,
                        data: data,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Session-Token': localStorage.getItem('SUNOPO_SESSION_TOKEN') || ''
                        },
                        onload: function(res) {
                            window.postMessage({ type: 'SunopoResponse', id: id, status: res.status, responseText: res.responseText }, '*');
                        },
                        onerror: function(err) {
                            window.postMessage({ type: 'SunopoResponse', id: id, status: 500, responseText: String(err) }, '*');
                        }
                    });
                } catch (e) {
                    console.error('Sunopo bridge error', e);
                }
            }, false);
        }
    }

    // --- AUTO-SCROLL TO LOAD ALL SONGS ---
    function autoScroll() {
        console.log("🖱️ Suno Sovereign Link: Auto-scrolling...");
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }

    // Ejecutar cada vez que entramos a Suno
    syncSession();

    // Iniciar auto-scroll si estamos en la página de biblioteca o feed
    if (window.location.href.includes('/me') || window.location.href.includes('/library')) {
        console.log("📜 Iniciando Auto-Scroll para cargar biblioteca...");
        // Scroll cada 3 segundos para dar tiempo a que carguen los temas
        const scrollInterval = setInterval(() => {
            const beforeScroll = window.scrollY;
            autoScroll();

            // Si después de 5 segundos la posición no cambia, quizás ya cargó todo
            setTimeout(() => {
                if (window.scrollY === beforeScroll) {
                    console.log("🏁 Parece que hemos llegado al final de la lista.");
                }
            }, 2000);
        }, 3000);

        // Botón para detener el scroll si te cansas
        const stopBtn = document.createElement('button');
        stopBtn.innerHTML = "⏹️ Detener Scroll Iyari";
        stopBtn.style.position = "fixed";
        stopBtn.style.bottom = "20px";
        stopBtn.style.right = "20px";
        stopBtn.style.zIndex = "10000";
        stopBtn.style.padding = "10px";
        stopBtn.style.background = "#ff5500";
        stopBtn.style.color = "white";
        stopBtn.onclick = () => {
            clearInterval(scrollInterval);
            stopBtn.remove();
        };
        document.body.appendChild(stopBtn);
    }

    // Re-sincronizar cada 5 minutos por si cambia
    setInterval(syncSession, 5 * 60 * 1000);

})();
