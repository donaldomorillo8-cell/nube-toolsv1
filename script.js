/* ==========================================================================
   NEXUS.AI - LÓGICA DE INTERACCIÓN, GOOGLE AUTH & ZONAS DRAG & DROP
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initGoogleAuth();
    setupDropZones();
});

/* Sistema de Notificaciones Toast */
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

/* Control del Modal de Autenticación */
function openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    switchAuthTab(tab);
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('formLogin');
    const registerForm = document.getElementById('formRegister');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');

    if (tab === 'login') {
        loginForm.classList.add('active-form');
        registerForm.classList.remove('active-form');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        registerForm.classList.add('active-form');
        loginForm.classList.remove('active-form');
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
    }
}

/* Manejo de Sesión Tradicional */
function handleLogin(e) {
    e.preventDefault();
    showToast('⚡ Sesión iniciada correctamente en NEXUS.AI');
    closeAuthModal();
    updateUserSession('Usuario Nexus');
}

function handleRegister(e) {
    e.preventDefault();
    showToast('🚀 Cuenta creada exitosamente. Bienvenido a la red.');
    closeAuthModal();
    updateUserSession('Nuevo Usuario');
}

function updateUserSession(userName) {
    const authContainer = document.getElementById('authContainer');
    authContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: var(--accent-cyan); font-weight: bold;"><i class="fa-solid fa-user-astronaut"></i> ${userName}</span>
            <button class="btn btn-outline" onclick="location.reload()"><i class="fa-solid fa-power-off"></i> Salir</button>
        </div>
    `;
}

/* Integración de Google Identity Services */
function initGoogleAuth() {
    window.onload = function () {
        if (typeof google !== 'undefined') {
            google.accounts.id.initialize({
                client_id: "774305802282-2flja2krsmhob5226uvj61ekjcktapvg.apps.googleusercontent.com", // Coloca tu Client ID de Google Cloud aquí
                callback: handleGoogleCredentialResponse
            });

            // Renderizar Botón Login de Google
            google.accounts.id.renderButton(
                document.getElementById("googleBtnLogin"),
                { theme: "dark", size: "large", text: "signin_with", shape: "pill" }
            );

            // Renderizar Botón Registro de Google
            google.accounts.id.renderButton(
                document.getElementById("googleBtnRegister"),
                { theme: "dark", size: "large", text: "signup_with", shape: "pill" }
            );
        }
    };
}

function handleGoogleCredentialResponse(response) {
    console.log("Token Google JWT recibido:", response.credential);
    showToast("✅ Autenticación exitosa con Google.");
    closeAuthModal();
    updateUserSession("Usuario Google");
}

/* Configuración de Arrastrar y Soltar (Drag & Drop) */
function setupDropZones() {
    const zones = [
        { drop: 'converterDropZone', input: 'converterInput' },
        { drop: 'compressorDropZone', input: 'compressorInput' },
        { drop: 'vocalDropZone', input: 'vocalInput' }
    ];

    zones.forEach(zone => {
        const dropEl = document.getElementById(zone.drop);
        const inputEl = document.getElementById(zone.input);

        dropEl.addEventListener('click', () => inputEl.click());

        dropEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropEl.classList.add('dragover');
        });

        dropEl.addEventListener('dragleave', () => {
            dropEl.classList.remove('dragover');
        });

        dropEl.addEventListener('drop', (e) => {
            e.preventDefault();
            dropEl.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                inputEl.files = e.dataTransfer.files;
                showToast(`📁 Archivo cargado: ${e.dataTransfer.files[0].name}`);
            }
        });

        inputEl.addEventListener('change', () => {
            if (inputEl.files.length) {
                showToast(`📁 Archivo seleccionado: ${inputEl.files[0].name}`);
            }
        });
    });
}

/* Simulaciones de Carga e Interacción */
function simulateProgress(progressContainerId, callback) {
    const container = document.getElementById(progressContainerId);
    const bar = container.querySelector('.progress-bar');
    container.style.display = 'block';
    bar.style.width = '0%';

    let current = 0;
    const interval = setInterval(() => {
        current += Math.floor(Math.random() * 15) + 10;
        if (current >= 100) {
            current = 100;
            clearInterval(interval);
            setTimeout(() => {
                container.style.display = 'none';
                callback();
            }, 500);
        }
        bar.style.width = `${current}%`;
    }, 200);
}

function processConversion() {
    const input = document.getElementById('converterInput');
    const target = document.getElementById('targetFormat').value;
    if (!input.files.length) {
        showToast('⚠️ Por favor carga un archivo para convertir.');
        return;
    }
    simulateProgress('converterProgress', () => {
        showToast(`🎉 Archivo convertido con éxito a formato .${target.toUpperCase()}`);
    });
}

function processCompression() {
    const input = document.getElementById('compressorInput');
    if (!input.files.length) {
        showToast('⚠️ Selecciona un archivo de video para comprimir.');
        return;
    }
    simulateProgress('compressorProgress', () => {
        showToast('⚡ Video reducido con éxito. Tamaño optimizado en un 60%.');
    });
}

function processVocalRemoval() {
    const input = document.getElementById('vocalInput');
    if (!input.files.length) {
        showToast('⚠️ Por favor sube un archivo de audio o video.');
        return;
    }
    simulateProgress('vocalProgress', () => {
        showToast('🎶 Pista procesada con éxito. Voz removida.');
    });
}