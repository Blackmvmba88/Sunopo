// ==UserScript==
// @name         Suno Sovereign Link (Auto-Updater)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Extrae automáticamente el Session ID de Suno y lo envía a Sunopo
// @author       Iyari Gomez System
// @match        https://suno.com/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function () {
    'use strict';

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

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
