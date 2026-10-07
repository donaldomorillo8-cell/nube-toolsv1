document.addEventListener('DOMContentLoaded', () => {
    initGoogleAuth();
    setupDropZones();
});

/* Sistema de Cambio de Vistas (Pestañas en lugar de Scroll) */
function switchView(viewId, event) {
    if (event) event.preventDefault();

    // Ocultar todas las pestañas
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active-content'));

    // Quitar estado activo de los links
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));

    // Activar la pestaña seleccionada
    const targetContent = document.getElementById(viewId);
    if (targetContent) {
        targetContent.classList.add('active-content');
    }

    // Marcar link activo si fue provisto
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

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
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    }
}

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

/* Integración Google */
function initGoogleAuth() {
    window.onload = function () {
        if (typeof google !== 'undefined') {
            google.accounts.id.initialize({
                client_id: "774305802282-2flja2krsmhob5226uvj61ekjcktapvg.apps.googleusercontent.com",
                callback: handleGoogleCredentialResponse
            });

            google.accounts.id.renderButton(
                document.getElementById("googleBtnLogin"),
                { theme: "dark", size: "large", text: "signin_with", shape: "pill" }
            );

            google.accounts.id.renderButton(
                document.getElementById("googleBtnRegister"),
                { theme: "dark", size: "large", text: "signup_with", shape: "pill" }
            );
        }
    };
}

function handleGoogleCredentialResponse(response) {
    showToast("✅ Autenticación exitosa con Google.");
    closeAuthModal();
    updateUserSession("Usuario Google");
}

/* Drag & Drop */
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

/* Simulación e Integración de Descargas */
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

function createDownloadButton(containerId, fileBlob, fileName) {
    const container = document.getElementById(containerId);
    const url = URL.createObjectURL(fileBlob);
    
    container.innerHTML = `
        <a href="${url}" download="${fileName}" class="download-link-btn">
            <i class="fa-solid fa-download"></i> Descargar ${fileName}
        </a>
    `;
}

function processConversion() {
    const input = document.getElementById('converterInput');
    const target = document.getElementById('targetFormat').value;
    if (!input.files.length) {
        showToast('⚠️ Por favor carga un archivo para convertir.');
        return;
    }
    
    const file = input.files[0];
    const newName = file.name.substring(0, file.name.lastIndexOf('.')) + `_converted.${target}`;

    simulateProgress('converterProgress', () => {
        // Crear archivo descargable
        const blob = new Blob(["Contenido convertido por NEXUS.AI para el archivo: " + file.name], { type: "text/plain" });
        createDownloadButton('converterDownloadArea', blob, newName);
        showToast(`🎉 ¡Archivo listo! Haz clic abajo para descargar.`);
    });
}

function processCompression() {
    const input = document.getElementById('compressorInput');
    if (!input.files.length) {
        showToast('⚠️ Selecciona un archivo de video para comprimir.');
        return;
    }

    const file = input.files[0];
    const newName = `compressed_${file.name}`;

    simulateProgress('compressorProgress', () => {
        const blob = new Blob([file], { type: file.type });
        createDownloadButton('compressorDownloadArea', blob, newName);
        showToast('⚡ Video reducido con éxito. Botón de descarga listo.');
    });
}

function processVocalRemoval() {
    const input = document.getElementById('vocalInput');
    if (!input.files.length) {
        showToast('⚠️ Por favor sube un archivo de audio o video.');
        return;
    }

    const file = input.files[0];
    const newName = `processed_instrumental_${file.name}`;

    simulateProgress('vocalProgress', () => {
        const blob = new Blob([file], { type: file.type });
        createDownloadButton('vocalDownloadArea', blob, newName);
        showToast('🎶 Pista procesada con éxito. Listo para descargar.');
    });
}